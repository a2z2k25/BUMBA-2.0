# Installer API Documentation

## Constants

<dl>
<dt><a href="#fs">fs</a></dt>
<dd><p>BUMBA Modular Installer
Orchestrates the installation process using modular components</p>
</dd>
<dt><a href="#chalk">chalk</a></dt>
<dd><p>BUMBA Installer Display Module
Handles all visual output and UI elements</p>
</dd>
<dt><a href="#fs">fs</a></dt>
<dd><p>BUMBA CLI Detection Module
Analyzes existing Claude configurations and frameworks</p>
</dd>
<dt><a href="#ora">ora</a></dt>
<dd><p>BUMBA MCP Server Installation Module
Manages MCP server discovery and documentation</p>
</dd>
<dt><a href="#ora">ora</a></dt>
<dd><p>BUMBA Quality Tools Installation Module
Manages quality tool detection and installation</p>
</dd>
<dt><a href="#fs">fs</a></dt>
<dd><p>BUMBA File Generation Module
Generates framework files and configurations</p>
</dd>
<dt><a href="#fs">fs</a></dt>
<dd><p>BUMBA Hook Generation Module
Creates quality enforcement hooks</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#createBackup">createBackup()</a></dt>
<dd><p>Create backup of existing installation</p>
</dd>
<dt><a href="#displayInstallationSummary">displayInstallationSummary()</a></dt>
<dd><p>Display installation summary</p>
</dd>
<dt><a href="#install">install()</a></dt>
<dd><p>Main installation function</p>
</dd>
<dt><a href="#displayLogo">displayLogo()</a></dt>
<dd><p>Display the BUMBA logo with gradient colors</p>
</dd>
<dt><a href="#displayVersion">displayVersion()</a></dt>
<dd><p>Display version and attribution</p>
</dd>
<dt><a href="#resetTerminalBackground">resetTerminalBackground()</a></dt>
<dd><p>Reset terminal formatting</p>
</dd>
<dt><a href="#analyzeExistingFrameworks">analyzeExistingFrameworks()</a></dt>
<dd><p>Detect and analyze existing frameworks</p>
</dd>
<dt><a href="#installMCPServers">installMCPServers()</a></dt>
<dd><p>Install MCP servers (documentation mode)</p>
</dd>
<dt><a href="#displayMCPResults">displayMCPResults()</a></dt>
<dd><p>Display MCP installation results</p>
</dd>
<dt><a href="#installQualityTools">installQualityTools()</a></dt>
<dd><p>Install quality enforcement tools</p>
</dd>
<dt><a href="#displayQualityToolsStatus">displayQualityToolsStatus()</a></dt>
<dd><p>Display quality tools installation status</p>
</dd>
<dt><a href="#generateClaudeMd">generateClaudeMd()</a></dt>
<dd><p>Generate CLAUDE.md content</p>
</dd>
<dt><a href="#generateSettings">generateSettings()</a></dt>
<dd><p>Generate settings.json content</p>
</dd>
<dt><a href="#generateFrameworkFiles">generateFrameworkFiles()</a></dt>
<dd><p>Generate framework files</p>
</dd>
<dt><a href="#generatePreExecutionHook">generatePreExecutionHook()</a></dt>
<dd><p>Generate pre-execution hook</p>
</dd>
<dt><a href="#generatePostExecutionHook">generatePostExecutionHook()</a></dt>
<dd><p>Generate post-execution hook</p>
</dd>
<dt><a href="#generateCompletionHook">generateCompletionHook()</a></dt>
<dd><p>Generate completion hook</p>
</dd>
<dt><a href="#generatePlaceholderHook">generatePlaceholderHook()</a></dt>
<dd><p>Generate placeholder hook</p>
</dd>
<dt><a href="#generateQualityHooks">generateQualityHooks()</a></dt>
<dd><p>Generate all quality hooks</p>
</dd>
</dl>

<a name="fs"></a>

## fs
BUMBA Modular Installer
Orchestrates the installation process using modular components

**Kind**: global constant  
<a name="chalk"></a>

## chalk
BUMBA Installer Display Module
Handles all visual output and UI elements

**Kind**: global constant  
<a name="fs"></a>

## fs
BUMBA CLI Detection Module
Analyzes existing Claude configurations and frameworks

**Kind**: global constant  
<a name="ora"></a>

## ora
BUMBA MCP Server Installation Module
Manages MCP server discovery and documentation

**Kind**: global constant  
<a name="ora"></a>

## ora
BUMBA Quality Tools Installation Module
Manages quality tool detection and installation

**Kind**: global constant  
<a name="fs"></a>

## fs
BUMBA File Generation Module
Generates framework files and configurations

**Kind**: global constant  
<a name="fs"></a>

## fs
BUMBA Hook Generation Module
Creates quality enforcement hooks

**Kind**: global constant  
<a name="createBackup"></a>

## createBackup()
Create backup of existing installation

**Kind**: global function  
<a name="displayInstallationSummary"></a>

## displayInstallationSummary()
Display installation summary

**Kind**: global function  
<a name="install"></a>

## install()
Main installation function

**Kind**: global function  
<a name="displayLogo"></a>

## displayLogo()
Display the BUMBA logo with gradient colors

**Kind**: global function  
<a name="displayVersion"></a>

## displayVersion()
Display version and attribution

**Kind**: global function  
<a name="resetTerminalBackground"></a>

## resetTerminalBackground()
Reset terminal formatting

**Kind**: global function  
<a name="analyzeExistingFrameworks"></a>

## analyzeExistingFrameworks()
Detect and analyze existing frameworks

**Kind**: global function  
<a name="installMCPServers"></a>

## installMCPServers()
Install MCP servers (documentation mode)

**Kind**: global function  
<a name="displayMCPResults"></a>

## displayMCPResults()
Display MCP installation results

**Kind**: global function  
<a name="installQualityTools"></a>

## installQualityTools()
Install quality enforcement tools

**Kind**: global function  
<a name="displayQualityToolsStatus"></a>

## displayQualityToolsStatus()
Display quality tools installation status

**Kind**: global function  
<a name="generateClaudeMd"></a>

## generateClaudeMd()
Generate CLAUDE.md content

**Kind**: global function  
<a name="generateSettings"></a>

## generateSettings()
Generate settings.json content

**Kind**: global function  
<a name="generateFrameworkFiles"></a>

## generateFrameworkFiles()
Generate framework files

**Kind**: global function  
<a name="generatePreExecutionHook"></a>

## generatePreExecutionHook()
Generate pre-execution hook

**Kind**: global function  
<a name="generatePostExecutionHook"></a>

## generatePostExecutionHook()
Generate post-execution hook

**Kind**: global function  
<a name="generateCompletionHook"></a>

## generateCompletionHook()
Generate completion hook

**Kind**: global function  
<a name="generatePlaceholderHook"></a>

## generatePlaceholderHook()
Generate placeholder hook

**Kind**: global function  
<a name="generateQualityHooks"></a>

## generateQualityHooks()
Generate all quality hooks

**Kind**: global function  
