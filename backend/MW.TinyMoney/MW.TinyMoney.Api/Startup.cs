using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MW.TinyMoney.Api.Controllers;
using MW.TinyMoney.Api.Infrasatructure;
using MW.TinyMoney.Api.Tags;
using MW.TinyMoney.Api.Vendors;

namespace MW.TinyMoney.Api
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            string domain = $"https://{Configuration["Auth0:Domain"]}/";
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            }).AddJwtBearer(options =>
            {
                options.Authority = domain;
                options.Audience = Configuration["Auth0:ApiIdentifier"];
            });

            services.AddControllers();

            services.AddCors(conf =>
            {
                conf.AddDefaultPolicy(builder =>
                    builder.WithOrigins(Configuration["Cors:AllowedOrigins"])
                        .WithHeaders("Authorization", "Content-Type")
                        .WithMethods("GET", "POST", "DELETE"));
            });

            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "MW.TinyMoney API", Version = "v1" });
            });

            services.AddTransient<MySqlConnectionFactory>();
            services.AddTransient<ITagStore, MySqlTagStore>();
            services.AddTransient<IBufferedTransactionStore, MySqlBufferedTransactionStore>();
            services.AddTransient<ITransactionStore, MySqlTransactionStore>();
            services.AddTransient<IVendorStore, MySqlVendorStore>();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseSwagger();
            app.UseSwaggerUI(c =>
            {
                c.SwaggerEndpoint("/swagger/v1/swagger.json", "MW.TinyMoney API V1");
            });

            app.UseAuthentication();

            app.UseCors();

            app.UseRouting();

            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });
        }
    }
}
