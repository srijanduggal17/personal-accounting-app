FROM ubuntu:24.04

# Avoid prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install Java (required for PlantUML), Graphviz, Node.js deps, SQLite, and utilities
RUN apt-get update && apt-get install -y \
    openjdk-21-jre-headless \
    graphviz \
    curl \
    wget \
    git \
    sqlite3 \
    libsqlite3-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 22.x (LTS) via NodeSource
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Download PlantUML jar
RUN wget -O /usr/local/bin/plantuml.jar \
    https://github.com/plantuml/plantuml/releases/latest/download/plantuml.jar

# Create a convenience wrapper script
RUN echo '#!/bin/bash\njava -jar /usr/local/bin/plantuml.jar "$@"' > /usr/local/bin/plantuml \
    && chmod +x /usr/local/bin/plantuml