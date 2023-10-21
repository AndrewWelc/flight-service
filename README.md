# Flight Service

A NestJS-based backend service that fetches, merges, and deduplicates flight data from multiple sources. The system is designed for scalability and high availability.

## Core Functionalities and Approach

1. **Data Fetching**: Fetches flight data from multiple sources using a generic flight source implementation. Allows easy scalability and utilizes Axios for requests with retry mechanisms.
2. **Data Merging and Deduplication**: Merges and deduplicates the fetched data.
3. **Caching**: Utilizes Redis for caching.
4. **Logging**: Uses NestJS's built-in Logger for logging.
5. **Fault Tolerance**: Implements a Circuit Breaker using the `opossum` library to provide resilience against failures from external services.

### Architecture and Code Structure

- **Flight Module**: Manages flight data and handles fetching from various sources.
- **Cache Module**: Responsible for all Redis caching functionalities.
- **Config Module**: Manages environment variables and configuration.
- **App Factory**: Sets up core functionalities like Swagger documentation, CORS, and API versioning.

#### Scalability and Extensibility

- **Generic Flight Source**: The system uses a generic interface for flight sources, which makes adding new sources easy.
- **Circuit Breaker**: Ensures the system can handle external failures gracefully.
- **Axios Retry**: Allows automatic retries on request failures, making the system more resilient.

### Migrations

Run `npm run migrate` to initialize the database with initial flight sources.

### Test Coverage

The service has test coverage using Jest for both the service and edge cases. Run `npm test` to execute the tests.

## Requirements

- Node.js
- Redis
- MongoDB

## Setup

1. **Clone the repository**

    ```sh
    git clone https://github.com/YourUsername/flight-service.git
    ```

2. **Install Dependencies**

    ```sh
    cd flight-service
    npm install
    ```

3. **Environment Setup**

    - Copy `example.env` to `.env`
    - Update Redis and MongoDB configurations.

4. **Run Database Migration**

    ```sh
    npm run migrate
    ```
  
5. **Start the Service**

    ```sh
    npm run start
    ```

    Or using Docker:

    ```sh
    docker-compose up --build
    ```

    The service should be available at `http://localhost:3000`.

## Additional Features

- **Swagger Documentation**: Accessible at `http://localhost:3000/api/docs` when running in non-production environments.
- **API Versioning**: The API uses URI versioning.
  