FROM eclipse-temurin:21-jre
ARG GH_VERSION=10.0
RUN apt-get update && apt-get install -y --no-install-recommends wget ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /graphhopper
RUN wget -q https://github.com/graphhopper/graphhopper/releases/download/${GH_VERSION}/graphhopper-web-${GH_VERSION}.jar -O graphhopper.jar
COPY config.yml wheelchair.json start.sh ./
RUN chmod +x start.sh
EXPOSE 8989 8990
ENTRYPOINT ["./start.sh"]
