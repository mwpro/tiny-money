FROM node:24-alpine AS frontbuild
WORKDIR /src
COPY ["tinymoney-frontend/package.json", "."]
RUN npm install
COPY ["tinymoney-frontend/", "."]
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS apibuild
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["backend/MW.TinyMoney.Api/MW.TinyMoney.Api.csproj", "MW.TinyMoney.Api/"]
COPY ["backend/MW.TinyMoney.UnitTests/MW.TinyMoney.UnitTests.csproj", "MW.TinyMoney.UnitTests/"]
RUN dotnet restore "MW.TinyMoney.Api/MW.TinyMoney.Api.csproj"
RUN dotnet restore "MW.TinyMoney.UnitTests/MW.TinyMoney.UnitTests.csproj"
COPY /backend .
RUN dotnet test "MW.TinyMoney.UnitTests/MW.TinyMoney.UnitTests.csproj" --no-restore -c Release
COPY --from=frontbuild /src/dist /src/MW.TinyMoney.Api/wwwroot
RUN dotnet publish "MW.TinyMoney.Api/MW.TinyMoney.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0-noble-chiseled AS base
WORKDIR /app
EXPOSE 8080
COPY --from=apibuild /app/publish .
ENTRYPOINT ["dotnet", "MW.TinyMoney.Api.dll"]