using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.OpenApi.Models;
using MW.TinyMoney.Api.Budget;
using MW.TinyMoney.Api.Categories;
using MW.TinyMoney.Api.Controllers;
using MW.TinyMoney.Api.Infrastructure;
using MW.TinyMoney.Api.Reports;
using MW.TinyMoney.Api.Tags;
using MW.TinyMoney.Api.Transaction;
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

            services.AddControllers().AddNewtonsoftJson();

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
            services.AddTransient<ICategoriesStore, MySqlCategoriesStore>();
            services.AddTransient<IReportsProvider, MySqlReportsProvider>();
            services.AddTransient<IBudgetStore, BudgetStore>();
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

            app.UseRouting();

            app.UseCors();
            
            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });
        }
    }
}
