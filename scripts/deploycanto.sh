#!/usr/bin/env bash

set -xo errexit



  npx graph-compiler --config ~/openzeppelin-subgraph-canto/configs/live/canto/nfts.json --include ~/openzeppelin-subgraph-canto/src/datasources --export-schema --export-subgraph
  npx graph codegen ~/openzeppelin-subgraph-canto/generated/live/canto/nfts.subgraph.yaml

  npx graph create --node http://localhost:8020 canto/nfts --access-token $ACCESS_TOKEN ~/openzeppelin-subgraph-canto/generated/live/canto/nfts.subgraph.yaml
  sleep 5
  npx graph deploy --node http://localhost:8020 --ipfs http://localhost:5001 canto/nfts --access-token $ACCESS_TOKEN ~/openzeppelin-subgraph-canto/generated/live/canto/nfts.subgraph.yaml

git 
