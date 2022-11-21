#!/usr/bin/env bash

set -xo errexit



  npx graph-compiler --config ~/oz-canto/configs/live/canto/nfts.json --include ~/oz-canto/src/datasources --export-schema --export-subgraph
  npx graph codegen ~/oz-canto/generated/live/canto/nfts.subgraph.yaml

  npx graph create --node http://localhost:8020 canto/nfts_refresh --access-token {$ACCESS_TOKEN} ~/oz-canto/generated/live/canto/nfts.subgraph.yaml
  sleep 5
  npx graph deploy --node http://localhost:8020 --ipfs http://localhost:5001 canto/nfts_refresh --access-token {$ACCESS_TOKEN} ~/oz-canto/generated/live/canto/nfts.subgraph.yaml


