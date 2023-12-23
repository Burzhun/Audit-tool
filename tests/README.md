## Temporary container test run

    docker-compose -p dv_jest -f docker-compose-api-tests.yml build 
    docker-compose -p dv_jest -f docker-compose-api-tests.yml up -d 
    docker-compose -p dv_jest -f docker-compose-api-tests.yml exec api npm ci
    docker-compose -p dv_jest -f docker-compose-api-tests.yml exec api npm run test_integration 
    docker-compose -p dv_jest -f docker-compose-api-tests.yml down --remove-orphans