# Flight Service

A NestJS-based backend service that fetches, merges, and deduplicates flight data from multiple sources

## Requirements
- Node.js
- Redis

## Setup

1. Clone the repository
    ```sh
    git clone https://github.com/AndrewWelc/flight-service.git
    ```

2. Install dependencies
    ```sh
    cd flight-service
    npm install
    ```

3. Setup Environment Variables
    - Copy `example.env` to `.env`
    - Fill in your Redis server details

4. Run the service
    ```sh
    npm run start
    ```

## Caching

The service uses Redis for caching flight data for an hour.

## Logging

The service uses NestJS's built-in Logger service for logging.
