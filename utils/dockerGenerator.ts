export const generateDockerCompose = (port: number | string = 6333): string => {
  return `version: '3'
services:
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "${port}:6333"
      - "6334:6334"
    volumes:
      - ./qdrant_storage:/qdrant/storage
    environment:
      - QDRANT__SERVICE__GRPC_PORT=6334
    restart: always

# Instructions:
# 1. Save this file as 'docker-compose.yml'
# 2. Run 'docker-compose up -d'
# 3. Qdrant will be available at http://localhost:${port}`;
};