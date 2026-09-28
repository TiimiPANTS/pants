FROM eclipse-temurin:21-jdk AS builder
WORKDIR /opt/app
COPY backend/.mvn/ .mvn/
COPY backend/mvnw backend/pom.xml ./
RUN chmod +x ./mvnw
RUN ./mvnw dependency:go-offline
COPY backend/src ./src
RUN ./mvnw clean install -DskipTests 
RUN find ./target -type f -name '*.jar' -exec cp {} /opt/app/app.jar \; -quit
FROM eclipse-temurin:21-jre-alpine
COPY --from=builder /opt/app/app.jar /opt/app/app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/opt/app/app.jar"]