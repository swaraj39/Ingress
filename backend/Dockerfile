FROM eclipse-temurin:17-jdk-alpine AS builder

WORKDIR /workspace

COPY pom.xml /workspace/pom.xml

RUN mvn -B dependency:go-offline

COPY src /workspace/src

RUN mvn -B package -DskipTests

FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY --from=builder /workspace/target/demo-0.0.1-SNAPSHOT.jar /app/app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
