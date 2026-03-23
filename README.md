<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

#test 
   1. Clonar proyecto
   2. ```yarn install```
   3. Clonar el archivo ```.env.template``` y renombrarlo a ```.env```
   4. Cambiar las variables de entorno
   5. Levantar la base de datos
   ```
   docker-compose up -d
   ```
   6. Levantar: ```yarn start:dev```
   7. Backup DB: ```docker exec -t DB-COMERCIAL pg_dump -U dev comercial-db > backup.sql```
   ```
   docker-compose up -d
   ```
   6. Cargar backup db: ```docker exec -i DB-COMERCIAL psql -U dev comercial-db < backup.sql```

