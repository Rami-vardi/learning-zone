# Human appearance assets

`male.glb` and `female.glb` are locally generated and fitted MakeHuman characters, with one fixed appearance for each option. Each file includes its geometry, skinning, materials and color maps. Both models reference the adjacent skin detail normal map.

Sources:

* MakeHuman Community MPFB base mesh, macro targets, game engine rig and skin weights, asset license CC0 1.0. Source: https://github.com/makehumancommunity/mpfb2 , source revision `9de0707fdc88438d7c53a1a2ac7937d9221e2431`.
* MakeHuman Community official system assets, explicitly released under CC0 in September 2020. Source: https://files2.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip . Asset listing: https://static.makehumancommunity.org/assets/assetpacks/makehuman_system_assets.html .
* Included source assets: young Caucasian male and female skin textures, low poly eyes and brown eye texture, eyebrow001, eyelashes01, short01 and ponytail01 hair. The 2048 pixel skin maps, hair strand textures, and brown eye atlas with its locally color graded irises are embedded in each file. The skin is opaque. Hair and eyes use alpha cutouts.
* The locally authored raglan shirt and training shorts derive from the fitted body surface and use its skin weights. The shirt has eased fabric over the torso and shallow folds at the waist. The shorts are eased around each thigh. Both have original texture atlases, with panels, stitching, knit, collar, cuffs, waistband and hems. Garment boundaries are cut into the evaluated mesh and weights are interpolated at those boundaries. Covered body faces are omitted to avoid intersection.
* The body skin detail normal map (`skin-human-002-detail.png`) derives from Katsukagi’s [Skin Human 002 normal map](https://3dtextures.me/2019/01/24/skin-human-002/), distributed under [CC0 1.0](https://3dtextures.me/about/). The original `Skin_Human_002_NRM.png` is available from the author’s linked [source folder](https://drive.google.com/drive/folders/1JavE9MwRR7WRK90hORLWMNHJUS4B6Vps). The 512-pixel derivative reverses the source green channel for glTF tangent space and uses mipmapped repeat sampling for fine detail.

Source asset notices credit Data Collection AB, Joel Palmius and Jonas Hauquier. The original CC0 dedication is in LICENSE-CC0.md. Names here acknowledge provenance and do not imply endorsement.

MPFB application source is AGPL licensed. It is used only as an offline character authoring tool and its application code is not included in these assets.

Export: glTF 2.0 binary, meters, Y up, neutral A pose, shared MakeHuman game_engine bone names. Rest bone endpoints and actual glTF joint world matrices are in the adjacent rig JSON files; matrices are row-major nested arrays. The app retargets these appearances to Johnny's existing movement controller.
