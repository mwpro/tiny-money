FROM node:24-alpine AS frontbuild
WORKDIR /src
COPY ["tinymoney-frontend/package.json", "."]
RUN npm install
COPY ["tinymoney-frontend/", "."]
RUN npm run build-docker

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS apibuild
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["backend/MW.TinyMoney.Api/MW.TinyMoney.Api.csproj", "MW.TinyMoney.Api/"]
RUN dotnet restore "MW.TinyMoney.Api/MW.TinyMoney.Api.csproj"
COPY /backend .
COPY --from=frontbuild /src/dist /src/MW.TinyMoney.Api/wwwroot
WORKDIR "/src/MW.TinyMoney.Api"
RUN dotnet publish "./MW.TinyMoney.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0-noble AS base 
#-chiseled
WORKDIR /app
EXPOSE 8080
COPY --from=apibuild /app/publish .
ENTRYPOINT ["dotnet", "MW.TinyMoney.Api.dll"]


