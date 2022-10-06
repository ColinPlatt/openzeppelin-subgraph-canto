#!/usr/bin/env bash

set -xo errexit



  npx graph-compiler --config configs/live/canto/nfts.json --include src/datasources --export-schema --export-subgraph
  npx graph codegen generated/live/canto/nfts.subgraph.yaml

  npx graph create --node http://localhost:8020 canto/nfts --access-token $ACCESS_TOKEN generated/live/canto/nfts.subgraph.yaml
  npx graph deploy --node http://localhost:8020 --ipfs http://localhost:5001 canto/alto --access-token $ACCESS_TOKEN generated/live/canto/nfts.subgraph.yaml

