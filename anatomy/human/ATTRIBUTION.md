# Human appearance assets

`male.glb` and `female.glb` are locally generated and fitted MakeHuman characters, with one fixed appearance for each option. Each file includes its geometry, skinning, materials and textures. No external runtime asset service is used.

Sources:

* MakeHuman Community MPFB base mesh, macro targets, game engine rig and skin weights, asset license CC0 1.0. Source: https://github.com/makehumancommunity/mpfb2 , source revision `9de0707fdc88438d7c53a1a2ac7937d9221e2431`.
* MakeHuman Community official system assets, explicitly released under CC0 in September 2020. Source: https://files2.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip . Asset listing: https://static.makehumancommunity.org/assets/assetpacks/makehuman_system_assets.html .
* Included source assets: young Caucasian male and female skin textures, low poly eyes and brown eye texture, eyebrow001, eyelashes01, short01 and ponytail01 hair. The original 2048 pixel skin maps and the hair strand and eye textures are embedded in each file. The skin is opaque. Hair and eyes use alpha cutouts.
* The locally authored raglan shirt and training shorts derive from the fitted body surface and use its skin weights. The shirt has eased fabric over the torso and shallow folds at the waist. The shorts are eased around each thigh. Both have original texture atlases, with panels, stitching, knit, collar, cuffs, waistband and hems. Garment boundaries are cut into the evaluated mesh and weights are interpolated at those boundaries. Covered body faces are omitted to avoid intersection.

Source asset notices credit Data Collection AB, Joel Palmius and Jonas Hauquier. The original CC0 dedication is in LICENSE-CC0.md. Names here acknowledge provenance and do not imply endorsement.

MPFB application source is AGPL licensed. It is used only as an offline character authoring tool and its application code is not included in these assets.

Export: glTF 2.0 binary, meters, Y up, neutral A pose, shared MakeHuman game_engine bone names. Rest bone endpoints and actual glTF joint world matrices are in the adjacent rig JSON files; matrices are row-major nested arrays. The app retargets these appearances to Johnny's existing movement controller.
