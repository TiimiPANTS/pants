# syntax=docker/dockerfile:1.7
FROM maven:3.9.16-eclipse-temurin-21 AS build

WORKDIR /workspace
COPY backend/pom.xml ./pom.xml
RUN --mount=type=cache,target=/root/.m2 mvn --batch-mode -ntp dependency:go-offline

COPY backend/src ./src
RUN --mount=type=cache,target=/root/.m2 \
	mvn --batch-mode -ntp package -DskipTests \
	&& set -- target/*.jar \
	&& [ -f "$1" ] \
	&& [ "$#" -eq 1 ] \
	&& cp "$1" /workspace/app.jar

FROM eclipse-temurin:21-jre

WORKDIR /app
COPY --chown=1001:0 --from=build /workspace/app.jar /app/app.jar

ENV PORT=8080
EXPOSE 8080
USER 1001

ENTRYPOINT ["sh", "-c", "exec java ${JAVA_OPTS:-} -Dserver.port=${PORT:-8080} -jar /app/app.jar"]
