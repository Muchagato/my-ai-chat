from fastapi import APIRouter, HTTPException
from ..mcp import mcp_registry
from ..models import MCPServerToggle

router = APIRouter(prefix="/mcp", tags=["MCP"])


@router.get("/servers")
async def list_mcp_servers():
    """List all available MCP servers."""
    return {"servers": mcp_registry.list_servers()}


@router.post("/servers/toggle")
async def toggle_mcp_server(toggle: MCPServerToggle):
    """Enable or disable an MCP server."""
    if toggle.enabled:
        success = mcp_registry.enable_server(toggle.name)
    else:
        success = mcp_registry.disable_server(toggle.name)

    if not success:
        raise HTTPException(status_code=404, detail=f"MCP server not found: {toggle.name}")

    return {"success": True, "name": toggle.name, "enabled": toggle.enabled}


@router.get("/servers/{name}")
async def get_mcp_server(name: str):
    """Get details of a specific MCP server."""
    server = mcp_registry.get(name)
    if not server:
        raise HTTPException(status_code=404, detail=f"MCP server not found: {name}")

    return server.to_dict()


@router.get("/tools")
async def list_enabled_tools():
    """List all tools from enabled MCP servers."""
    return {"tools": mcp_registry.get_enabled_tools()}
