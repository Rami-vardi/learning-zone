"""Generate high-detail head geometry and game-ready textures in Blender 4.3+.

Place base_head.obj in the working directory and run:
    blender --background --python generate_human_skin.py

Other input/output locations and JSON overrides are optional:
    blender -b --python generate_human_skin.py -- --input ./heads/head.obj --output ./bake --config settings.json

Inputs use meters. The default Blender OBJ import settings are Y up and
NEGATIVE_Z forward. For a matching OBJ export the head stands along +Y
and the nose points toward +Z. For data already in Blender coordinates (+Z
up, nose toward -Y) set obj_up_axis="Z" and obj_forward_axis="Y". Set obj_scale=.01 for an
OBJ authored in centimeters. The face must face Blender -Y after import.
The fallback masks assume a head with a short neck, not an entire character.
Clean non-overlapping UVs in the first tile are required to bake one atlas.

Optional linear EXRs in textures/ beside the OBJ:
    secondary_anatomy.exr       Registered to the head UVs, gray at rest.
    xyz_multichannel_disp.exr   Registered RGB: secondary bumps, pores, fine lines.
A generic seamless normal or height tile is a different input format.
All four data maps are 16-bit PNG. Use them as Non-Color textures. Normals use
OpenGL +Y. Height=.5 is zero; (value-.5)*2*height_range_m yields meters.
Cavity=.5 is neutral, lower is concave, higher is convex.
"""

CONFIG = {
    "input_obj": "base_head.obj",
    "output_dir": "output",
    "texture_dir": "textures",
    "uv_map": "UVMap",
    "obj_scale": 1.0,
    "obj_forward_axis": "NEGATIVE_Z",
    "obj_up_axis": "Y",
    "render_subdivision": 5,
    "viewport_subdivision": 2,
    "secondary_strength_m": 0.00065,
    "pore_scale_m": 0.00065,
    "procedural_pore_depth_m": 0.00011,
    "procedural_line_depth_m": 0.00007,
    "scan_secondary_m": 0.0008,
    "scan_pore_m": 0.00035,
    "scan_line_m": 0.00015,
    "scan_midlevel": 0.5,
    "cavity_suppression": 0.85,
    "texture_resolution": 4096,
    "preview_resolution": 1080,
    "bake_samples": 32,
    "preview_samples": 64,
    "bake_margin_px": 16,
    "cage_extrusion_m": 0.003,
    "max_ray_distance_m": 0.012,
    "height_range_m": 0.004,
    "preview_sss_weight": 0.09,
    "preview_sss_radius_m": 0.0012,
    "use_gpu": False,
}

from contextlib import contextmanager, ExitStack
from pathlib import Path
import argparse
import json
import math
import os
import struct
import sys
import tempfile
import time
import traceback
import zlib

import bpy
from mathutils import Vector
import _cycles as cycles_runtime
import numpy as np


def log(message):
    print(f"[skin {time.strftime('%H:%M:%S')}] {message}", flush=True)


def settings(argv):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--input", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--config", type=Path, help="JSON object overriding CONFIG")
    args = parser.parse_args(argv)
    cfg = dict(CONFIG)
    if args.config:
        overrides = json.loads(args.config.read_text(encoding="utf-8"))
        if not isinstance(overrides, dict):
            raise ValueError("Configuration must be a JSON object.")
        unknown = set(overrides) - cfg.keys()
        if unknown:
            raise ValueError(f"Unknown configuration keys: {sorted(unknown)}")
        cfg.update(overrides)
    for key, default in CONFIG.items():
        value = cfg[key]
        if type(default) is float:
            if type(value) not in (int, float) or not math.isfinite(value):
                raise ValueError(f"{key} must be a finite number")
        elif type(value) is not type(default):
            raise ValueError(f"{key} expects {type(default).__name__}")
    if not 0 <= cfg["viewport_subdivision"] <= cfg["render_subdivision"] <= 10:
        raise ValueError("Require 0 <= viewport_subdivision <= render_subdivision <= 10.")
    for name in ("texture_resolution", "preview_resolution", "bake_samples", "preview_samples", "obj_scale", "height_range_m", "pore_scale_m", "preview_sss_radius_m"):
        if cfg[name] <= 0:
            raise ValueError(f"{name} must be positive")
    for name in ("secondary_strength_m", "procedural_pore_depth_m", "procedural_line_depth_m", "scan_secondary_m", "scan_pore_m", "scan_line_m", "cage_extrusion_m", "max_ray_distance_m", "bake_margin_px"):
        if cfg[name] < 0:
            raise ValueError(f"{name} must be nonnegative")
    for name in ("scan_midlevel", "cavity_suppression", "preview_sss_weight"):
        if not 0 <= cfg[name] <= 1:
            raise ValueError(f"{name} must be in [0,1]")
    axes = {"X", "Y", "Z", "NEGATIVE_X", "NEGATIVE_Y", "NEGATIVE_Z"}
    forward, up = cfg["obj_forward_axis"], cfg["obj_up_axis"]
    if forward not in axes or up not in axes or forward[-1] == up[-1]:
        raise ValueError("OBJ forward and up must specify different coordinate axes.")
    src = Path(args.input or cfg["input_obj"]).expanduser().resolve()
    if not src.is_file() or src.suffix.lower() != ".obj":
        raise FileNotFoundError(f"Expected a readable OBJ head at {src}")
    cfg["input_obj"] = src
    cfg["texture_dir"] = (src.parent / Path(cfg["texture_dir"]).expanduser()).resolve()
    cfg["output_dir"] = (args.output.expanduser() if args.output else src.parent / Path(cfg["output_dir"]).expanduser()).resolve()
    return cfg


def import_head(cfg):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = 'METRIC'
    scene.unit_settings.scale_length = 1.0
    status = bpy.ops.wm.obj_import(
        filepath=str(cfg["input_obj"]), global_scale=cfg["obj_scale"],
        forward_axis=cfg["obj_forward_axis"], up_axis=cfg["obj_up_axis"],
        use_split_objects=False, use_split_groups=False, import_vertex_groups=True,
    )
    meshes = [obj for obj in scene.objects if obj.type == 'MESH']
    if status != {'FINISHED'} or len(meshes) != 1:
        raise ValueError("OBJ import must produce one head mesh. Check the file's faces.")
    low = meshes[0]
    low.name = "Skin_Low_Bake_Target"
    bpy.context.view_layer.objects.active = low
    low.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    mesh = low.data
    if not mesh.polygons or not mesh.uv_layers:
        raise ValueError("The head must contain faces with non-overlapping UV coordinates.")
    uv = mesh.uv_layers.get(cfg["uv_map"])
    if uv is None and len(mesh.uv_layers) == 1:
        uv = mesh.uv_layers[0]
        uv.name = cfg["uv_map"]
    if uv is None:
        raise ValueError(f"Could not identify requested UV layer {cfg['uv_map']!r}.")
    mesh.uv_layers.active = uv
    uv.active_render = True
    mesh.calc_loop_triangles()
    uv_area = 0.0
    for tri in mesh.loop_triangles:
        a, b, c = [uv.data[loop].uv.copy() for loop in tri.loops]
        for pt in (a, b, c):
            if any(not math.isfinite(x) or x < -.00001 or x > 1.00001 for x in pt):
                raise ValueError("UV coordinates must be finite and inside the first [0,1] tile.")
        uv_area += abs((b - a).cross(c - a)) * .5
    if uv_area < .000001:
        raise ValueError("The imported UVs have no usable area.")
    mesh.polygons.foreach_set("use_smooth", [True] * len(mesh.polygons))
    high = low.copy()
    high.data = mesh.copy()
    high.name = "Skin_High_Detail"
    scene.collection.objects.link(high)
    low.select_set(False)
    high.select_set(True)
    bpy.context.view_layer.objects.active = high
    bpy.context.view_layer.update()
    width, depth, height = low.dimensions
    log(f"Imported {len(mesh.polygons):,} faces. Head dimensions {width:.3f} × {depth:.3f} × {height:.3f} m.")
    if not .12 <= height <= .55:
        log("Check the OBJ scale and orientation: the height is outside the expected human head range.")
    multires = high.modifiers.new("Skin Multiresolution", 'MULTIRES')
    for level in range(1, cfg["render_subdivision"] + 1):
        status = bpy.ops.object.multires_subdivide(modifier=multires.name, mode="CATMULL_CLARK")
        if status != {'FINISHED'}:
            raise RuntimeError(f"Multires subdivision failed at level {level}.")
        log(f"Created Multiresolution level {level}.")
    multires.render_levels = cfg["render_subdivision"]
    multires.levels = cfg["viewport_subdivision"]
    return high, low


_SKIN_REGION_NAMES = (
    "brow_ridge", "nasolabial_fold", "forehead_creases",
    "cheek_volume", "nose_zone", "eyelid_smooth",
)


def _skin_clamp01(value):
    return max(0.0, min(float(value), 1.0))


def _skin_ramp(value, low, high):
    t = _skin_clamp01((value - low) / max(1.e-12, high - low))
    return t * t * (3.0 - 2.0 * t)


def _skin_base_curvature(mesh):
    """Signed cotangent mean curvature in inverse metres, positive on a convex surface."""
    mesh.calc_loop_triangles()
    count = len(mesh.vertices)
    coords = [v.co.copy() for v in mesh.vertices]
    totals = [Vector((0, 0, 0)) for _ in coords]
    areas = [0.0] * count
    boundary = set()
    edge_counts = {}
    for tri in mesh.loop_triangles:
        ids = tuple(tri.vertices)
        a, b, c = (coords[idx] for idx in ids)
        double_area = (b-a).cross(c-a).length
        if double_area < 1.e-14:
            continue
        for i in ids:
            areas[i] += double_area / 6.0
        for k in range(3):
            i, j, opp = ids[k], ids[(k+1) % 3], ids[(k+2) % 3]
            key = (min(i, j), max(i, j))
            edge_counts[key] = edge_counts.get(key, 0) + 1
            cot = (coords[i] - coords[opp]).dot(coords[j] - coords[opp]) / double_area
            term = cot * (coords[i] - coords[j])
            totals[i] += term
            totals[j] -= term
    for (i, j), n in edge_counts.items():
        if n != 2:
            boundary.update((i, j))
    return [max(-400., min(400., v.normal.dot(totals[i]) / (4.0 * areas[i])))
            if areas[i] > 1.e-14 and i not in boundary else 0.0
            for i, v in enumerate(mesh.vertices)]


def _skin_float_attr(mesh, name, values):
    attr = mesh.attributes.get(name)
    if attr and (attr.domain != 'POINT' or attr.data_type != 'FLOAT'):
        raise ValueError(f"{name} must be a point-domain float attribute")
    if not attr:
        attr = mesh.attributes.new(name, 'FLOAT', 'POINT')
    attr.data.foreach_set("value", values)


def _skin_prepare_regions(obj, cfg):
    mesh = obj.data
    if not len(mesh.vertices) or not len(mesh.polygons):
        raise ValueError("Skin detail requires a nonempty mesh surface.")
    coords = [v.co for v in mesh.vertices]
    top = max(p.z for p in coords)
    bottom = min(p.z for p in coords)
    height = max(top - bottom, .001)
    # Neutral human input is scaled in metres. On a bust the shoulders can be
    # much wider than the head, so measure lateral/depth bounds at forehead level.
    head_height = min(.235, height * .133) if height > .95 else min(.235, height * .94)
    chin = top - head_height
    central_y = [p.y for p in coords if .42 < (p.z - chin) / head_height < .87]
    head = [p for p in coords if .42 < (p.z - chin) / head_height < .87]
    if len(head) < 6:
        head = coords
        central_y = [p.y for p in head]
    left, right = min(p.x for p in head), max(p.x for p in head)
    front, back = min(central_y), max(central_y)
    radius = max((right - left) / 2.0, .0001)
    center = (left + right) / 2.0
    depth = max(back - front, .0001)
    curvature = _skin_base_curvature(mesh)
    _skin_float_attr(mesh, "skin_base_curvature", curvature)
    missing = {name: obj.vertex_groups.new(name=name) for name in _SKIN_REGION_NAMES
               if obj.vertex_groups.get(name) is None}
    def gaussian(dx, dz):
        return math.exp(-.5 * (dx*dx + dz*dz))
    neck_mask = []
    asymmetry = []
    for i, p in enumerate(coords):
        lateral = (p.x-center)/radius
        x = abs(lateral)
        z = (p.z-chin)/head_height
        frontness = 1.0 - _skin_ramp((p.y-front)/depth, .31, .74)
        face = frontness * _skin_ramp(-mesh.vertices[i].normal.y, -.25, .33)
        concave = _skin_ramp(-curvature[i], 7., 70.)
        convex = _skin_ramp(curvature[i], 5., 65.)
        # Paired masks follow the orbital arch and the oblique infra-nasal fold.
        fold_x = .235 + .90 * (.40 - z)
        features = {
            "brow_ridge": gaussian((x-.42)/.24, (z-(.585+.035*math.sin(x*4.5)))/.056) * (.70+.30*convex),
            "nasolabial_fold": gaussian((x-fold_x)/.058, (z-.27)/.105) * (.58+.42*concave),
            "forehead_creases": gaussian(x/.69, (z-.728)/.102) * (.79+.21*concave),
            "cheek_volume": gaussian((x-.58)/.255, (z-.405)/.106) * (.73+.27*convex),
            "nose_zone": gaussian(x/.205, (z-.443)/.104) * (.84+.16*convex),
            "eyelid_smooth": gaussian((x-.405)/.205, (z-.521)/.053),
        }
        for name, group in missing.items():
            weight = _skin_clamp01(face * features[name])
            if weight > .00002:
                group.add([i], weight, 'REPLACE')
        neck = gaussian(x/.8, (z+.195)/.117) * frontness
        neck_mask.append(_skin_clamp01(neck))
        asymmetry.append(math.sin(1.85*lateral+.54*z) * math.cos(1.26*z))
    _skin_float_attr(mesh, "skin_neck_lines", neck_mask)
    _skin_float_attr(mesh, "skin_form_asymmetry", asymmetry)
    mesh.update()
    if missing:
        log("Generated approximate facial masks: " + ", ".join(missing) +
            ". Existing painted groups take precedence.")
    return head_height


class _SkinFieldGraph:
    """Small field builder with deterministic column/row layout for editable node trees."""
    def __init__(self, obj, name):
        self.tree = bpy.data.node_groups.new(name, 'GeometryNodeTree')
        self.tree.interface.new_socket(name="Geometry", in_out='INPUT', socket_type='NodeSocketGeometry')
        self.tree.interface.new_socket(name="Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')
        self.depth = {}
        self.rows = {}
        self.input = self.node('NodeGroupInput', "Incoming skin")
        self.modifier = obj.modifiers.new(name, 'NODES')
        self.modifier.node_group = self.tree
        self.attrs = {}

    def node(self, kind, label):
        n = self.tree.nodes.new(kind)
        n.label = label
        n.width = 195
        self.depth[n.name] = 0
        return n

    def connect(self, n, inp, value):
        socket = n.inputs[inp]
        if isinstance(value, bpy.types.NodeSocket):
            self.tree.links.new(value, socket)
            self.depth[n.name] = max(self.depth[n.name], self.depth[value.node.name]+1)
        else:
            socket.default_value = value

    def scalar(self, op, a, b, label):
        n = self.node('ShaderNodeMath', label)
        n.operation = op
        self.connect(n, 0, a)
        self.connect(n, 1, b)
        return n.outputs[0]

    def vector(self, op, a, b, label):
        n = self.node('ShaderNodeVectorMath', label)
        n.operation = op
        self.connect(n, 0, a)
        self.connect(n, 'Scale' if op == 'SCALE' else 1, b)
        return n.outputs['Value' if op in ('DOT_PRODUCT','DISTANCE') else 'Vector']

    def ramp(self, a, lo, hi, out_lo, out_hi, label):
        n = self.node('ShaderNodeMapRange', label)
        n.interpolation_type = 'SMOOTHERSTEP'
        n.clamp = True
        for name, val in [('Value',a),('From Min',lo),('From Max',hi),('To Min',out_lo),('To Max',out_hi)]:
            self.connect(n, name, val)
        return n.outputs['Result']

    def attr(self, name, data_type='FLOAT'):
        key = (name, data_type)
        if key not in self.attrs:
            n = self.node('GeometryNodeInputNamedAttribute', name)
            n.data_type = data_type
            self.connect(n, 'Name', name)
            self.attrs[key] = n.outputs['Attribute']
        return self.attrs[key]

    def record(self, surface, name, field):
        n = self.node('GeometryNodeStoreNamedAttribute', 'Capture ' + name)
        n.data_type = 'FLOAT'
        n.domain = 'POINT'
        self.connect(n, 'Geometry', surface)
        self.connect(n, 'Name', name)
        self.connect(n, 'Value', field)
        return n.outputs['Geometry']

    def offset(self, geometry, field, label):
        normal = self.node('GeometryNodeInputNormal', "Local surface normal").outputs[0]
        vector = self.vector('SCALE', normal, field, "Signed offset in metres")
        n = self.node('GeometryNodeSetPosition', label)
        self.connect(n, 'Geometry', geometry)
        self.connect(n, 'Offset', vector)
        return n.outputs['Geometry']

    def image_rgb(self, image, uv_map):
        n = self.node('GeometryNodeImageTexture', image.name)
        n.interpolation = 'Linear'
        self.connect(n, 'Image', image)
        self.connect(n, 'Vector', self.attr(uv_map, 'FLOAT_VECTOR'))
        # UV layers are face-corner data. Sample each chart before reducing to
        # vertices: averaging the UV coordinates first can jump across an atlas.
        corners = self.node('GeometryNodeFieldOnDomain', "Sample UV charts before seam averaging")
        corners.data_type = 'FLOAT_COLOR'
        corners.domain = 'CORNER'
        self.connect(corners, 'Value', n.outputs['Color'])
        separate = self.node('FunctionNodeSeparateColor', "Independent linear RGB channels")
        separate.mode = 'RGB'
        self.connect(separate, 'Color', corners.outputs[0])
        return tuple(separate.outputs[i] for i in range(3))

    def finish(self, geometry):
        output = self.node('NodeGroupOutput', 'Detailed skin')
        self.connect(output, 'Geometry', geometry)
        for n in self.tree.nodes:
            d = self.depth[n.name]
            row = self.rows.get(d, 0)
            n.location = (245*d, -row*270)
            self.rows[d] = row + 1


def _skin_image(path):
    if not path.is_file():
        return None
    image = bpy.data.images.load(str(path), check_existing=True)
    image.colorspace_settings.name = 'Non-Color'
    if not image.has_data:
        # Accessing pixels forces lazy loading, including validation by OCIO/OIIO.
        if not len(image.pixels):
            raise ValueError(f"Cannot read displacement texture {path}")
    return image


def _skin_secondary(obj, cfg, secondary, uv, head_height):
    g = _SkinFieldGraph(obj, 'SkinSecondaryAnatomy_GN')
    attr, f = g.attr, g.scalar
    strength = float(cfg.get('secondary_strength_m', .00065))
    mid = float(cfg.get('scan_midlevel', .5))
    if secondary:
        red = g.image_rgb(secondary, uv)[0]
        displacement = f('SUBTRACT', red, mid, "Neutral-centered secondary EXR")
        # The painted/coarse facial regions gate the supplied secondary form.
        face = attr('brow_ridge')
        for name in ('nasolabial_fold','forehead_creases','cheek_volume','nose_zone'):
            face = f('MAXIMUM', face, attr(name), "Union of anatomical regions")
        form = f('MULTIPLY', displacement, face, "Local anatomical EXR")
    else:
        # Broad, smooth form. Brow and cheek project, the nasolabial fold recedes.
        brow = f('MULTIPLY', attr('brow_ridge'), .64, "Brow prominence")
        cheek = f('MULTIPLY', attr('cheek_volume'), .85, "Cheek volume")
        fold = f('MULTIPLY', attr('nasolabial_fold'), -.78, "Nasolabial fold")
        pos = g.node('GeometryNodeInputPosition', 'Skin position in metres').outputs[0]
        wave = g.node('ShaderNodeTexWave', 'Broad forehead relief')
        wave.wave_type = 'BANDS'
        wave.bands_direction = 'Z'
        g.connect(wave, 'Vector', pos)
        g.connect(wave, 'Scale', 2*math.pi/(20*max(.004,head_height*.049)))
        g.connect(wave, 'Distortion', 1.4)
        g.connect(wave, 'Detail', 1.)
        crease = g.ramp(wave.outputs['Fac'], .64, .97, 0, -.33, "Shallow forehead crease")
        crease = f('MULTIPLY', crease, attr('forehead_creases'), "Forehead region")
        form = f('ADD', f('ADD', brow, cheek, "Brow and cheek"), f('ADD', fold, crease, "Folds and creases"), "Anatomical form")
    asym = f('MULTIPLY', attr('skin_form_asymmetry'), .045, "Gentle lateral asymmetry")
    if not secondary:
        # Blender 4.x Noise fBM is the current equivalent of Musgrave fBM.
        # Sample in unsymmetrized, shifted local space at broad anatomical scale.
        shifted = g.vector('ADD', pos, (.031,-.053,.078), "Off-center macro coordinates")
        broad = g.node('ShaderNodeTexNoise', "Musgrave-style low frequency fBM")
        broad.noise_type = 'FBM'
        broad.normalize = True
        g.connect(broad, 'Vector', shifted)
        g.connect(broad, 'Scale', 2.75/head_height)
        g.connect(broad, 'Detail', 2.25)
        g.connect(broad, 'Roughness', .52)
        centered = f('SUBTRACT', broad.outputs['Fac'], .5, "Neutral-centered broad variation")
        variation = f('MULTIPLY', centered, .20, "At most ±10% of anatomical amplitude")
        asym = f('ADD', asym, variation, "Lateral and fractal form variation")
    form = f('MULTIPLY', form, f('ADD', 1., asym, 'Gentle asymmetry'), "Asymmetric secondary form")
    eye = g.ramp(attr('eyelid_smooth'), 0., .82, 1., .12, "Protect soft eyelids")
    form = f('MULTIPLY', f('MULTIPLY', form, eye, "Eyelid protection"), strength, "Secondary relief in metres")
    geo = g.record(g.input.outputs[0], "skin_secondary_displacement", form)
    g.finish(g.offset(geo, attr("skin_secondary_displacement"), "Displace secondary anatomy"))


def _skin_evaluated_curvature(g):
    # Uniform one-ring Laplacian on the actual subdivided, secondary-displaced
    # surface. Divide by local mean squared edge length to remove LOD dependence.
    position = g.node('GeometryNodeInputPosition', 'Secondary-displaced position').outputs[0]
    normal = g.node('GeometryNodeInputNormal', 'Secondary-displaced normal').outputs[0]
    blur = g.node('GeometryNodeBlurAttribute', 'Average one ring of positions')
    blur.data_type = 'FLOAT_VECTOR'
    g.connect(blur, 'Value', position)
    g.connect(blur, 'Iterations', 1)
    outward = g.vector('SUBTRACT', position, blur.outputs[0], "Surface minus neighbor average")
    height = g.vector('DOT_PRODUCT', outward, normal, "Signed local convexity")
    edge = g.node('GeometryNodeInputMeshEdgeVertices', 'Local edge endpoints')
    length = g.vector('DISTANCE', edge.outputs['Position 1'], edge.outputs['Position 2'], "Edge length in metres")
    sq = g.scalar('MULTIPLY', length, length, "Squared edge length")
    domain = g.node('GeometryNodeFieldOnDomain', 'Evaluate squared length on edges')
    domain.data_type = 'FLOAT'
    domain.domain = 'EDGE'
    g.connect(domain, 'Value', sq)
    denom = g.scalar('MAXIMUM', domain.outputs[0], 1.e-14, "Nonzero local edge scale")
    # Blender's Safe Divide treats tiny denominators as zero, so first convert
    # the squared metres and the normal projection to matching millimetre units.
    numerator = g.scalar('MULTIPLY', height, 4.e6, "Signed height × 4 × 10⁶")
    denominator = g.scalar('MULTIPLY', denom, 1.e6, "Mean squared edge length in mm²")
    curvature = g.scalar('DIVIDE', numerator, denominator, "Mean curvature • positive on ridges")
    return curvature


def _skin_micro(obj, cfg, scan, uv):
    g = _SkinFieldGraph(obj, 'SkinMicroDetail_GN')
    f, attr = g.scalar, g.attr
    geo = g.input.outputs[0]
    if scan:
        red, green, blue = g.image_rgb(scan, uv)
        mid = float(cfg.get('scan_midlevel', .5))
        r = f('SUBTRACT', red, mid, "Scan R minus neutral")
        scan_form = f('MULTIPLY', r, float(cfg.get('scan_secondary_m',.0008)), "R • secondary metres")
        geo = g.record(geo, "skin_scan_secondary_displacement", scan_form)
        scan_amount = attr("skin_scan_secondary_displacement")
        combined = f('ADD', attr("skin_secondary_displacement"), scan_amount, "Anatomy plus scan red")
        geo = g.record(geo, "skin_secondary_displacement", combined)
        geo = g.offset(geo, scan_amount, "Apply scan R before measuring cavities")
    geo = g.record(geo, "skin_curvature", _skin_evaluated_curvature(g))
    local_cavity = g.ramp(attr('skin_curvature'), -82., -10., 1., 0., "Deep displaced cavities")
    base_cavity = g.ramp(attr('skin_base_curvature'), -82., -10., .55, 0., "Coarse fold support")
    cavity = f('MAXIMUM', local_cavity, base_cavity, "Combine local and anatomical recesses")
    geo = g.record(geo, 'skin_cavity', cavity)
    if scan:
        pores = f('MULTIPLY', f('SUBTRACT', green, mid, "Scan G minus neutral"), float(cfg.get('scan_pore_m', .00035)), "G • pore metres")
        lines = f('MULTIPLY', f('SUBTRACT', blue, mid, "Scan B minus neutral"), float(cfg.get('scan_line_m', .00015)), "B • fine-line metres")
        fine = f('ADD', pores, lines, "Combine independent fine scan bands")
    else:
        pore_scale = max(.00003, float(cfg.get('pore_scale_m', .00065)))
        position = g.node('GeometryNodeInputPosition', "Local physical coordinates").outputs[0]
        vor = g.node('ShaderNodeTexVoronoi', "Round, irregular pore centers")
        vor.voronoi_dimensions = '3D'
        vor.feature = 'F1'
        vor.distance = 'EUCLIDEAN'
        g.connect(vor, 'Vector', position)
        g.connect(vor, 'Scale', 1.0 / pore_scale)
        pore = g.ramp(vor.outputs['Distance'], .10, .45, -1., .045, "Round pore hollows")
        nose_cheeks = f('MAXIMUM', attr('nose_zone'), attr('cheek_volume'), "Cheeks and nose")
        pore_region = g.ramp(nose_cheeks, 0., .84, .27, 1., "Regional pore depth")
        pores = f('MULTIPLY', pore, pore_region, "Pore distribution")
        pores = f('MULTIPLY', pores, float(cfg.get('procedural_pore_depth_m',.00011)), "Physical pore depth")
        stretched = g.vector('MULTIPLY', position, (.40,.58,2.35), "Stretch fine lines along skin")
        noise = g.node('ShaderNodeTexNoise', "Directional noise modulation")
        g.connect(noise, 'Vector', stretched)
        g.connect(noise, 'Scale', 1.0 / (pore_scale*13.))
        g.connect(noise, 'Detail', 2.3)
        wav = g.node('ShaderNodeTexWave', "Forehead and neck fine lines")
        wav.wave_type = 'BANDS'
        wav.bands_direction = 'Z'
        g.connect(wav, 'Vector', position)
        g.connect(wav, 'Scale', 2.0*math.pi/(20.0*pore_scale*4.1))
        g.connect(wav, 'Distortion', 2.7)
        g.connect(wav, 'Detail', 2.0)
        phase = f('MULTIPLY', noise.outputs['Fac'], 4.2, "Noise variation along bands")
        g.connect(wav, 'Phase Offset', phase)
        line = g.ramp(wav.outputs['Fac'], .56, .99, .04, -1., "Shallow fine line")
        line = f('MULTIPLY', line, noise.outputs['Fac'], "Break up fine lines")
        fore_neck = f('MAXIMUM', attr('forehead_creases'), attr('skin_neck_lines'), "Forehead and neck")
        line = f('MULTIPLY', line, fore_neck, "Regional directional lines")
        line = f('MULTIPLY', line, float(cfg.get('procedural_line_depth_m',.00007)), "Physical fine-line depth")
        fine = f('ADD', pores, line, "Pores plus fine lines")
    amount = _skin_clamp01(cfg.get('cavity_suppression',.85))
    cavity_attenuation = f('SUBTRACT', 1., f('MULTIPLY', attr('skin_cavity'), amount, "Deep fold suppression"), "Retain relief on open skin")
    eyelids = g.ramp(attr('eyelid_smooth'), 0., .85, 1., .12, "Fine soft eyelid detail")
    fine = f('MULTIPLY', f('MULTIPLY', fine, cavity_attenuation, "Suppress relief inside cavities"), eyelids, "Final signed micro relief")
    geo = g.record(geo, "skin_micro_displacement", fine)
    total = f('ADD', attr('skin_secondary_displacement'), attr('skin_micro_displacement'), "Accumulated normal-displacement metres")
    geo = g.record(geo, "skin_total_displacement", total)
    g.finish(g.offset(geo, attr("skin_micro_displacement"), "Displace actual skin surface"))


def add_anatomy_detail(high, cfg):
    """Attach editable, metre-calibrated secondary and tertiary detail after Multires."""
    if high.type != 'MESH' or not any(mod.type == 'MULTIRES' for mod in high.modifiers):
        raise ValueError("Prepare the high mesh and its Multires modifier before adding skin detail.")
    texture_dir = Path(cfg['texture_dir'])
    secondary = _skin_image(texture_dir / 'secondary_anatomy.exr')
    scan = _skin_image(texture_dir / 'xyz_multichannel_disp.exr')
    uv = cfg.get('uv_map', 'UVMap')
    if (secondary or scan) and high.data.uv_layers.get(uv) is None:
        raise ValueError(f"Provided displacement EXR requires UV layer {uv!r}.")
    head_height = _skin_prepare_regions(high, cfg)
    _skin_secondary(high, cfg, secondary, uv, head_height)
    _skin_micro(high, cfg, scan, uv)
    log("Secondary anatomy: " + (secondary.name if secondary else "regional procedural form") +
        ". Microdetail: " + (scan.name if scan else "regional Voronoi pores and directional fine lines") + ".")


HEIGHT_ATTR = "skin_total_displacement"
CURVATURE_ATTR = "skin_curvature"
CAVITY_ATTR = "skin_cavity"


@contextmanager
def _scene(name):
    window = bpy.context.window
    previous = window.scene if window else None
    scene = bpy.data.scenes.new(name)
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    try:
        if window:
            window.scene = scene
            yield scene
        else:
            with bpy.context.temp_override(scene=scene, view_layer=scene.view_layers[0]):
                yield scene
    finally:
        if window:
            window.scene = previous
        bpy.data.scenes.remove(scene)


def _mesh_copy(source, stack, render_level=None):
    multires = [modifier for modifier in source.modifiers if modifier.type == "MULTIRES"]
    old_levels = [modifier.levels for modifier in multires]
    try:
        if render_level is not None:
            for modifier in multires:
                modifier.levels = min(render_level, modifier.total_levels)
        bpy.context.view_layer.update()
        depsgraph = bpy.context.evaluated_depsgraph_get()
        evaluated = source.evaluated_get(depsgraph)
        mesh = bpy.data.meshes.new_from_object(
            evaluated, preserve_all_data_layers=True, depsgraph=depsgraph
        )
    finally:
        for modifier, level in zip(multires, old_levels):
            modifier.levels = level
    stack.callback(bpy.data.meshes.remove, mesh)
    if not mesh.polygons:
        raise ValueError(f"\"{source.name}\" has no evaluated faces.")
    return mesh


def _link_object(scene, stack, name, data, matrix):
    obj = bpy.data.objects.new(name, data)
    stack.callback(bpy.data.objects.remove, obj, do_unlink=True)
    scene.collection.objects.link(obj)
    obj.matrix_world = matrix
    return obj


def _material(stack, name):
    material = bpy.data.materials.new(name)
    stack.callback(bpy.data.materials.remove, material)
    material.use_nodes = True
    material.node_tree.nodes.clear()
    return material


def _assign_only_material(mesh, material):
    mesh.materials.clear()
    mesh.materials.append(material)
    mesh.polygons.foreach_set("material_index", np.zeros(len(mesh.polygons), dtype=np.int32))
    mesh.update()


def _cycles(scene, cfg, samples_key):
    scene.render.engine = "CYCLES"
    scene.cycles.device = "GPU" if cfg["use_gpu"] else "CPU"
    scene.cycles.samples = cfg[samples_key]


def _math(nodes, links, operation, *operands):
    node = nodes.new("ShaderNodeMath")
    node.operation = operation
    for index, operand in enumerate(operands):
        if isinstance(operand, (int, float)):
            node.inputs[index].default_value = operand
        else:
            links.new(operand, node.inputs[index])
    return node


def _attribute(nodes, name):
    node = nodes.new("ShaderNodeAttribute")
    node.attribute_type = "GEOMETRY"
    node.attribute_name = name
    return node.outputs["Fac"]


def _source_shader(material, key, height_range):
    nodes, links = material.node_tree.nodes, material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    if key in {"normal", "ao"}:
        surface = nodes.new("ShaderNodeBsdfPrincipled")
    else:
        surface = nodes.new("ShaderNodeEmission")
        if key == "height":
            meters = _attribute(nodes, HEIGHT_ATTR)
            scale = _math(nodes, links, "MULTIPLY", meters, 0.5 / height_range)
            normalized = _math(nodes, links, "ADD", scale.outputs[0], 0.5)
        else:
            curvature = _attribute(nodes, CURVATURE_ATTR)
            cavity = _attribute(nodes, CAVITY_ATTR)
            local_curvature = _math(nodes, links, "MULTIPLY", curvature, 0.006)
            local_curvature = _math(nodes, links, "MAXIMUM", local_curvature.outputs[0], -1.0)
            local_curvature = _math(nodes, links, "MINIMUM", local_curvature.outputs[0], 1.0)
            rim_contrast = _math(nodes, links, "MULTIPLY", local_curvature.outputs[0], 0.35)
            fold_contrast = _math(nodes, links, "MULTIPLY", cavity, 0.30)
            neutral_rim = _math(nodes, links, "ADD", rim_contrast.outputs[0], 0.5)
            normalized = _math(nodes, links, "SUBTRACT", neutral_rim.outputs[0], fold_contrast.outputs[0])
        normalized.use_clamp = True
        if key == "height":
            # The green channel records a valid high-mesh hit, even if height is at its minimum.
            channels = nodes.new("ShaderNodeCombineColor")
            channels.mode = "RGB"
            channels.inputs[1].default_value = 1.0
            channels.inputs[2].default_value = 0.0
            links.new(normalized.outputs[0], channels.inputs[0])
            links.new(channels.outputs[0], surface.inputs["Color"])
        else:
            links.new(normalized.outputs[0], surface.inputs["Color"])
    links.new(surface.outputs[0], output.inputs["Surface"])


def _chunk(stream, kind, content):
    stream.write(struct.pack(">I", len(content)))
    stream.write(kind)
    stream.write(content)
    stream.write(struct.pack(">I", zlib.crc32(content, zlib.crc32(kind))))


def _write_linear_png(image, path, uncovered, *, hit_mask=None, height_signal=False):
    """Encode Blender's linear float buffer directly, with no display transform."""
    color_space = image.colorspace_settings.name
    if color_space != "Non-Color":
        raise ValueError(f"Expected a Non-Color bake buffer, got {color_space!r}.")
    width, height = image.size
    pixels = np.empty(width * height * 4, dtype=np.float32)
    image.pixels.foreach_get(pixels)
    pixels = pixels.reshape((height, width, 4))
    if height_signal:
        hit_mask = (pixels[..., 3] > 0.0) & (pixels[..., 1] > 0.5)
    if hit_mask is None or not np.any(hit_mask):
        raise RuntimeError(f"No UV texels were baked for {path.name}. Check projection and UVs.")

    compressor = zlib.compressobj(level=6)
    with path.open("wb") as stream:
        stream.write(b"\x89PNG\r\n\x1a\n")
        # RGB, 16 bits per channel, no color profile or gamma transformation.
        _chunk(stream, b"IHDR", struct.pack(">IIBBBBB", width, height, 16, 2, 0, 0, 0))
        for row, covered in zip(pixels[::-1], hit_mask[::-1]):
            rgb = row[:, :3].copy()
            written = covered & (row[:, 3] > 0.0)
            if height_signal:
                rgb[:] = row[:, :1]
            if not np.isfinite(rgb[written]).all():
                raise RuntimeError(f"Non-finite bake samples in {path.name}.")
            rgb[~written] = uncovered
            encoded = np.rint(np.clip(rgb, 0.0, 1.0) * 65535.0).astype(">u2")
            compressed = compressor.compress(b"\0" + encoded.tobytes())
            if compressed:
                _chunk(stream, b"IDAT", compressed)
        _chunk(stream, b"IDAT", compressor.flush())
        _chunk(stream, b"IEND", b"")
    return hit_mask


def bake_maps(high, low, cfg, output_dir):
    """Bake and write tangent-space normal, AO, cavity and signed height maps.

    The height PNG's 0.5 midpoint is zero meters. Decode with
    (sample - 0.5) * 2 * cfg["height_range_m"]. Normal uses +X, +Y, +Z.
    Cavity is 0.5 for a locally flat surface, brighter at convex rims,
    and darker at concave folds. AO is white where unoccluded.
    """
    output_dir = Path(output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    resolution = cfg["texture_resolution"]
    height_range = cfg["height_range_m"]
    if resolution < 1 or height_range <= 0:
        raise ValueError("Bake resolution and the signed height range must be positive.")
    filenames = {
        "height": "skin_height.png",
        "normal": "skin_normal.png",
        "ao": "skin_ao.png",
        "cavity": "skin_cavity.png",
    }
    pass_type = {"normal": "NORMAL", "ao": "AO", "cavity": "EMIT", "height": "EMIT"}
    backgrounds = {"normal": (0.5, 0.5, 1.0), "ao": (1.0, 1.0, 1.0),
                   "cavity": (0.5, 0.5, 0.5), "height": (0.5, 0.5, 0.5)}
    with tempfile.TemporaryDirectory(prefix=".skin-maps-", dir=output_dir) as staging, ExitStack() as stack:
        high_mesh = _mesh_copy(high, stack, cfg["render_subdivision"])
        low_mesh = _mesh_copy(low, stack)
        if not low_mesh.uv_layers.active:
            raise ValueError("The low head needs an active UV map before baking.")
        for name in (HEIGHT_ATTR, CURVATURE_ATTR, CAVITY_ATTR):
            attribute = high_mesh.attributes.get(name)
            if not attribute or attribute.domain != "POINT" or attribute.data_type != "FLOAT":
                raise ValueError(f"Expected a POINT FLOAT attribute named {name!r} on the high head.")

        scene = stack.enter_context(_scene("Skin Map Bake"))
        _cycles(scene, cfg, "bake_samples")
        source_mat = _material(stack, "Skin Bake Source")
        target_mat = _material(stack, "Skin Bake Target")
        _assign_only_material(high_mesh, source_mat)
        _assign_only_material(low_mesh, target_mat)
        src = _link_object(scene, stack, "Skin Bake High", high_mesh, high.matrix_world.copy())
        dst = _link_object(scene, stack, "Skin Bake Low", low_mesh, low.matrix_world.copy())
        src.select_set(True)
        dst.select_set(True)
        scene.view_layers[0].objects.active = dst

        node = target_mat.node_tree.nodes.new("ShaderNodeTexImage")
        node.select = True
        target_mat.node_tree.nodes.active = node
        target_surface = target_mat.node_tree.nodes.new("ShaderNodeBsdfPrincipled")
        target_output = target_mat.node_tree.nodes.new("ShaderNodeOutputMaterial")
        target_mat.node_tree.links.new(target_surface.outputs[0], target_output.inputs["Surface"])
        target_mat.node_tree.nodes.active = node

        hit_mask = None
        for key, filename in filenames.items():
            print(f"[skin-bake] Cycles {pass_type[key]} pass: {filename}", flush=True)
            image = bpy.data.images.new(
                f"Skin Bake {key}", width=resolution, height=resolution,
                alpha=True, float_buffer=True, is_data=True,
            )
            try:
                image.colorspace_settings.name = "Non-Color"
                node.image = image
                _source_shader(source_mat, key, height_range)
                scene.view_layers[0].update()
                result = bpy.ops.object.bake(
                    type=pass_type[key], target="IMAGE_TEXTURES", save_mode="INTERNAL",
                    use_selected_to_active=True, use_clear=True, use_cage=True,
                    cage_extrusion=cfg["cage_extrusion_m"], max_ray_distance=cfg["max_ray_distance_m"],
                    normal_space="TANGENT", normal_r="POS_X", normal_g="POS_Y", normal_b="POS_Z",
                    margin=cfg["bake_margin_px"], margin_type="EXTEND",
                    uv_layer=low_mesh.uv_layers.active.name,
                )
                if "FINISHED" not in result:
                    raise RuntimeError(f"Cycles did not finish baking {filename}: {result!r}.")
                hit_mask = _write_linear_png(
                    image, Path(staging) / filename, backgrounds[key],
                    hit_mask=hit_mask, height_signal=key == "height",
                )
            finally:
                node.image = None
                bpy.data.images.remove(image)

        for filename in filenames.values():
            os.replace(Path(staging) / filename, output_dir / filename)
    return {key: output_dir / filename for key, filename in filenames.items()}


def _look_at(obj, target):
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()


def _studio_light(scene, stack, name, center, axes, offset, span, power, size, color):
    light = bpy.data.lights.new(name, "AREA")
    stack.callback(bpy.data.lights.remove, light)
    light.energy = power * span * span
    light.shape = "DISK"
    light.size = span * size
    light.color = color
    obj = _link_object(scene, stack, name, light, axes.to_matrix().to_4x4())
    obj.location = center + axes @ Vector(offset) * span
    _look_at(obj, center)


def render_preview(high, cfg, output_dir):
    """Render a three-quarter studio portrait of the evaluated high head."""
    output_dir = Path(output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    filename = "preview_render.png"
    with tempfile.TemporaryDirectory(prefix=".skin-preview-", dir=output_dir) as staging, ExitStack() as stack:
        mesh = _mesh_copy(high, stack, cfg["render_subdivision"])
        local_points = np.empty(len(mesh.vertices) * 3, dtype=np.float32)
        mesh.vertices.foreach_get("co", local_points)
        local_points = local_points.reshape((-1, 3))
        lower = local_points.min(axis=0)
        upper = local_points.max(axis=0)
        bounds = [Vector((x, y, z)) for x in (lower[0], upper[0])
                  for y in (lower[1], upper[1]) for z in (lower[2], upper[2])]
        del local_points

        scene = stack.enter_context(_scene("Skin Clay Preview"))
        _cycles(scene, cfg, "preview_samples")
        scene.cycles.use_denoising = cycles_runtime.with_openimagedenoise
        scene.view_settings.view_transform = "AgX"
        material = _material(stack, "Neutral Warm Skin Clay")
        shader = material.node_tree.nodes.new("ShaderNodeBsdfPrincipled")
        shader.inputs["Base Color"].default_value = (0.285, 0.18, 0.128, 1.0)
        shader.inputs["Roughness"].default_value = 0.48
        shader.inputs["Subsurface Weight"].default_value = cfg["preview_sss_weight"]
        shader.inputs["Subsurface Radius"].default_value = (1.0, 0.52, 0.31)
        shader.inputs["Subsurface Scale"].default_value = cfg["preview_sss_radius_m"]
        material_output = material.node_tree.nodes.new("ShaderNodeOutputMaterial")
        material.node_tree.links.new(shader.outputs[0], material_output.inputs["Surface"])
        _assign_only_material(mesh, material)
        mesh.polygons.foreach_set("use_smooth", np.ones(len(mesh.polygons), dtype=np.bool_))
        mesh.update()
        matrix = high.matrix_world.copy()
        axes = matrix.to_quaternion()
        object_bounds = [matrix @ point for point in bounds]
        center = sum(object_bounds, Vector()) / len(object_bounds)
        span = max((first - second).length for first in object_bounds for second in object_bounds)
        if span <= 0.0:
            raise ValueError("Cannot frame a head with a degenerate bounding box.")
        _link_object(scene, stack, "Skin Preview Head", mesh, matrix)

        world = bpy.data.worlds.new("Skin Preview World")
        stack.callback(bpy.data.worlds.remove, world)
        world.use_nodes = True
        world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.071, 0.078, 0.092, 1.0)
        world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.27
        scene.world = world

        camera_data = bpy.data.cameras.new("Skin Preview Camera")
        stack.callback(bpy.data.cameras.remove, camera_data)
        camera = _link_object(scene, stack, "Skin Preview Camera", camera_data, matrix)
        camera.location = center + (axes @ Vector((0.63, -1.0, 0.18))).normalized() * span * 2.6
        _look_at(camera, center)
        camera.data.type = "ORTHO"
        camera.data.clip_start = max(0.0001, span * 0.005)
        camera.data.clip_end = span * 30.0
        camera_basis = camera.rotation_euler.to_quaternion().inverted()
        projected = [camera_basis @ (point - center) for point in object_bounds]
        camera.data.ortho_scale = 1.13 * max(
            max(point.x for point in projected) - min(point.x for point in projected),
            max(point.y for point in projected) - min(point.y for point in projected),
        )
        scene.camera = camera

        _studio_light(scene, stack, "Key", center, axes, (-1.03, -0.76, 0.70), span, 92, 0.47, (1.0, 0.94, 0.86))
        _studio_light(scene, stack, "Fill", center, axes, (0.70, -0.91, 0.12), span, 25, 0.91, (0.86, 0.93, 1.0))
        _studio_light(scene, stack, "Rim", center, axes, (0.25, 1.12, 0.46), span, 55, 0.27, (1.0, 0.91, 0.80))

        scene.render.image_settings.file_format = "PNG"
        scene.render.image_settings.color_mode = "RGB"
        scene.render.image_settings.color_depth = "8"
        scene.render.resolution_x = scene.render.resolution_y = cfg["preview_resolution"]
        scene.render.resolution_percentage = 100
        scene.render.filepath = str(Path(staging) / filename)
        print(f"[skin-bake] Rendering Cycles studio portrait: {filename}", flush=True)
        result = bpy.ops.render.render(write_still=True)
        path = Path(staging) / filename
        if "FINISHED" not in result or not path.is_file():
            raise RuntimeError(f"Cycles did not finish rendering the preview: {result!r}.")
        os.replace(path, output_dir / filename)
    return output_dir / filename


@contextmanager
def publication_lock(destination):
    """Concurrent builds may render in parallel and publish one complete set at a time."""
    if os.name == "nt":
        import msvcrt
        with (destination / ".skin-publish.lock").open("a+b") as stream:
            if stream.tell() == 0:
                stream.write(b"0")
                stream.flush()
            stream.seek(0)
            msvcrt.locking(stream.fileno(), msvcrt.LK_LOCK, 1)
            try:
                yield
            finally:
                stream.seek(0)
                msvcrt.locking(stream.fileno(), msvcrt.LK_UNLCK, 1)
    else:
        import fcntl
        fd = os.open(destination, os.O_RDONLY)
        try:
            fcntl.flock(fd, fcntl.LOCK_EX)
            yield
        finally:
            os.close(fd)


def publish_images(stage, destination):
    """Keep unrelated files and roll back the previous map set on publication errors."""
    names = ("skin_normal.png", "skin_ao.png", "skin_cavity.png", "skin_height.png", "preview_render.png")
    for name in names:
        file = stage / name
        if not file.is_file() or file.stat().st_size < 64:
            raise RuntimeError(f"Expected output was absent or incomplete: {name}")
        target = destination / name
        if target.is_dir():
            raise IsADirectoryError(str(target))
    backups = stage / "previous"
    backups.mkdir()
    published = []
    try:
        for name in names:
            target = destination / name
            if target.exists() or target.is_symlink():
                os.replace(target, backups / name)
            os.replace(stage / name, target)
            published.append(name)
    except OSError:
        for name in reversed(names):
            saved, target = backups / name, destination / name
            if saved.exists() or saved.is_symlink():
                os.replace(saved, target)
            elif name in published:
                target.unlink()
        raise


def run_pipeline(argv):
    if bpy.app.version < (4, 3, 0):
        raise RuntimeError("Blender 4.3 or newer is required.")
    cfg = settings(argv)
    dest = cfg["output_dir"]
    dest.mkdir(parents=True, exist_ok=True)
    log(f"Blender {bpy.app.version_string}. Input {cfg['input_obj']}, output {dest}")
    high, low = import_head(cfg)
    log("Building facial masks, secondary anatomy and pore detail")
    add_anatomy_detail(high, cfg)
    # Render and bake into the destination filesystem so final replacements are atomic.
    with tempfile.TemporaryDirectory(prefix=".skin-bake-", dir=dest) as work:
        stage = Path(work)
        bake_maps(high, low, cfg, stage)
        render_preview(high, cfg, stage)
        with publication_lock(dest):
            publish_images(stage, dest)
    log(f"Finished all four data maps and the studio preview in {dest}")


if __name__ == "__main__":
    try:
        arguments = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
        run_pipeline(arguments)
    except Exception:
        traceback.print_exc()
        sys.stderr.flush()
        sys.stdout.flush()
        # A failing unattended Blender run must signal failure even when launched
        # with the simple command in the header, without --python-exit-code.
        sys.exit(1)
