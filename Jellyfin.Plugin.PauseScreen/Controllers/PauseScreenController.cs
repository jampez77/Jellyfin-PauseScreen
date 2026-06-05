using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Jellyfin.Plugin.PauseScreen.Controllers;

/// <summary>
/// Serves the embedded PauseScreen JavaScript asset.
/// </summary>
[ApiController]
[AllowAnonymous]
[Route("pausescreen")]
public class PauseScreenController : ControllerBase
{
    private const string ResourceName = "Jellyfin.Plugin.PauseScreen.Resources.pausescreen.js";

    /// <summary>
    /// Gets the PauseScreen client script.
    /// </summary>
    /// <returns>The embedded JavaScript file.</returns>
    [HttpGet("pausescreen.js")]
    [ResponseCache(Duration = 300, Location = ResponseCacheLocation.Any)]
    public IActionResult GetScript()
    {
        Stream? stream = Assembly.GetExecutingAssembly().GetManifestResourceStream(ResourceName);
        if (stream is null)
        {
            return NotFound();
        }

        return File(stream, "text/javascript; charset=utf-8");
    }
}
