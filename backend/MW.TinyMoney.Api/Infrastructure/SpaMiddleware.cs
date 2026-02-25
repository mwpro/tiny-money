using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace MW.TinyMoney.Api.Infrastructure;

public static class SpaMiddleware
{
    // based on https://github.com/dotnet/dotnet/blob/main/src/aspnetcore/src/Middleware/Spa/SpaServices.Extensions/src/SpaDefaultPageMiddleware.cs#L12
    // but does not include whole SpaServices.Extensions which is incompatible with AOT
    public static void UseSpaDefaultPageRewrite(this IApplicationBuilder app)
    {
        app.Use((context, next) =>
        {
            if (context.GetEndpoint() != null)
            {
                return next(context);        
            }
            context.Request.Path = "/index.html";
            return next(context);
        });
        app.UseStaticFiles();
    }
}