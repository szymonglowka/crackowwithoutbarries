#!/bin/sh
# OWNER: A2. Downloads the Malopolskie OSM extract once (named volume) and
# starts GraphHopper. First start imports the graph and takes a few minutes.
set -e
mkdir -p /data
if [ ! -f /data/malopolskie-latest.osm.pbf ]; then
  echo "Downloading malopolskie OSM extract (~150MB)..."
  wget -O /data/malopolskie-latest.osm.pbf https://download.geofabrik.de/europe/poland/malopolskie-latest.osm.pbf
fi
exec java -Xmx2g -jar /graphhopper/graphhopper.jar server /graphhopper/config.yml
