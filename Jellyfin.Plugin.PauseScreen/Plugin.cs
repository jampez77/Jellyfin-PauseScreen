using Jellyfin.Plugin.PauseScreen.Configuration;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Common.Plugins;
using MediaBrowser.Model.Serialization;

namespace Jellyfin.Plugin.PauseScreen;

/// <summary>
/// Jellyfin plugin entry point.
/// </summary>
public class Plugin : BasePlugin<PluginConfiguration>
{
    /// <summary>
    /// Initializes a new instance of the <see cref="Plugin"/> class.
    /// </summary>
    /// <param name="applicationPaths">Jellyfin application paths.</param>
    /// <param name="xmlSerializer">Jellyfin XML serializer.</param>
    public Plugin(IApplicationPaths applicationPaths, IXmlSerializer xmlSerializer)
        : base(applicationPaths, xmlSerializer)
    {
        Instance = this;
    }

    /// <summary>
    /// Gets the active plugin instance.
    /// </summary>
    public static Plugin? Instance { get; private set; }

    /// <inheritdoc />
    public override string Name => "Jellyfin-PauseScreen";

    /// <inheritdoc />
    public override Guid Id => Guid.Parse("f2296cc1-6a2f-47b0-a4f8-7ea953617fe6");

    /// <inheritdoc />
    public override string Description => "Injects the PauseScreen JavaScript file into Jellyfin Web clients.";
}
