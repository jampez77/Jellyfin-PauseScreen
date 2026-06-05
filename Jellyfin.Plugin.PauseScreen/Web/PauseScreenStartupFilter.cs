using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;

namespace Jellyfin.Plugin.PauseScreen.Web;

/// <summary>
/// Adds PauseScreen HTML injection middleware to Jellyfin's request pipeline.
/// </summary>
public sealed class PauseScreenStartupFilter : IStartupFilter
{
    /// <inheritdoc />
    public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next)
    {
        return app =>
        {
            app.UseMiddleware<PauseScreenInjectionMiddleware>();
            next(app);
        };
    }
}
