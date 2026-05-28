using System.Text;
using Microsoft.AspNetCore.Http;

namespace Jellyfin.Plugin.PauseScreen.Web;

/// <summary>
/// Injects the PauseScreen script tag into Jellyfin Web HTML responses without changing files on disk.
/// </summary>
public sealed class PauseScreenInjectionMiddleware
{
    private const string ScriptPath = "/pausescreen/pausescreen.js";
    private readonly RequestDelegate _next;

    /// <summary>
    /// Initializes a new instance of the <see cref="PauseScreenInjectionMiddleware"/> class.
    /// </summary>
    /// <param name="next">The next middleware in the request pipeline.</param>
    public PauseScreenInjectionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    /// <summary>
    /// Handles the current HTTP request.
    /// </summary>
    /// <param name="context">The HTTP context.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public async Task InvokeAsync(HttpContext context)
    {
        if (!ShouldInspect(context.Request))
        {
            await _next(context).ConfigureAwait(false);
            return;
        }

        Stream originalBody = context.Response.Body;
        await using MemoryStream buffer = new();
        context.Request.Headers.Remove("Accept-Encoding");
        context.Response.Body = buffer;

        try
        {
            await _next(context).ConfigureAwait(false);

            buffer.Position = 0;
            if (!ShouldInject(context.Response))
            {
                await buffer.CopyToAsync(originalBody, context.RequestAborted).ConfigureAwait(false);
                return;
            }

            using StreamReader reader = new(buffer, Encoding.UTF8, detectEncodingFromByteOrderMarks: true, leaveOpen: true);
            string html = await reader.ReadToEndAsync(context.RequestAborted).ConfigureAwait(false);
            string pathBase = context.Request.PathBase.HasValue ? context.Request.PathBase.Value! : string.Empty;
            string scriptUrl = pathBase + ScriptPath;
            string injectedHtml = InjectScript(html, scriptUrl);

            byte[] bytes = Encoding.UTF8.GetBytes(injectedHtml);
            context.Response.ContentLength = bytes.Length;
            await originalBody.WriteAsync(bytes, context.RequestAborted).ConfigureAwait(false);
        }
        finally
        {
            context.Response.Body = originalBody;
        }
    }

    private static bool ShouldInspect(HttpRequest request)
    {
        if (!HttpMethods.IsGet(request.Method))
        {
            return false;
        }

        PathString path = request.Path;
        return path.Equals("/web", StringComparison.OrdinalIgnoreCase)
            || path.Equals("/web/", StringComparison.OrdinalIgnoreCase)
            || path.Equals("/web/index.html", StringComparison.OrdinalIgnoreCase);
    }

    private static bool ShouldInject(HttpResponse response)
    {
        return response.StatusCode == StatusCodes.Status200OK
            && !response.Headers.ContainsKey("Content-Encoding")
            && response.ContentType?.Contains("text/html", StringComparison.OrdinalIgnoreCase) == true;
    }

    private static string InjectScript(string html, string scriptUrl)
    {
        if (html.Contains(scriptUrl, StringComparison.OrdinalIgnoreCase))
        {
            return html;
        }

        string scriptTag = $"<script defer src=\"{scriptUrl}\"></script>";
        int headCloseIndex = html.IndexOf("</head>", StringComparison.OrdinalIgnoreCase);
        if (headCloseIndex >= 0)
        {
            return html.Insert(headCloseIndex, scriptTag);
        }

        int bodyCloseIndex = html.IndexOf("</body>", StringComparison.OrdinalIgnoreCase);
        if (bodyCloseIndex >= 0)
        {
            return html.Insert(bodyCloseIndex, scriptTag);
        }

        return html + scriptTag;
    }
}
