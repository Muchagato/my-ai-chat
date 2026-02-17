"""
UI Tree Builder Helpers

This module provides helper functions to build UI tree structures
that the frontend will render with @json-render/react.

UI trees have the structure:
{
    "_type": "ui-tree",
    "root": "root-element-key",
    "elements": {
        "element-key": {
            "key": "element-key",
            "type": "ComponentType",
            "props": { ... },
            "children": ["child-key-1", "child-key-2"]
        }
    }
}
"""

from typing import Any, Optional


def create_ui_tree(root_key: str, elements: dict) -> dict:
    """Create a UI tree structure that the frontend will render with json-render."""
    return {
        "_type": "ui-tree",
        "root": root_key,
        "elements": elements
    }


# ============================================
# Layout Components
# ============================================

def card(
    key: str,
    title: str = None,
    description: str = None,
    children: list = None
) -> tuple[str, dict]:
    """Create a Card element."""
    props = {}
    if title:
        props["title"] = title
    if description:
        props["description"] = description

    return key, {
        "key": key,
        "type": "Card",
        "props": props,
        "children": children or []
    }


def grid(
    key: str,
    columns: int = 2,
    gap: str = "md",
    children: list = None
) -> tuple[str, dict]:
    """Create a Grid element."""
    return key, {
        "key": key,
        "type": "Grid",
        "props": {"columns": columns, "gap": gap},
        "children": children or []
    }


def stack(
    key: str,
    direction: str = "vertical",
    gap: str = "md",
    children: list = None
) -> tuple[str, dict]:
    """Create a Stack element."""
    return key, {
        "key": key,
        "type": "Stack",
        "props": {"direction": direction, "gap": gap},
        "children": children or []
    }


# ============================================
# Data Display Components
# ============================================

def metric(
    key: str,
    label: str,
    value: Any,
    format: str = None,
    trend: str = None,
    trend_value: str = None
) -> tuple[str, dict]:
    """Create a Metric element.

    Args:
        key: Unique element key
        label: Label text for the metric
        value: The metric value (string or number)
        format: Value format ('currency', 'percent', 'number', 'text')
        trend: Trend direction ('up', 'down', 'neutral')
        trend_value: Trend value text (e.g., '+12.5%')
    """
    props = {
        "label": label,
        "value": value,
    }
    if format:
        props["format"] = format
    if trend:
        props["trend"] = trend
    if trend_value:
        props["trendValue"] = trend_value

    return key, {
        "key": key,
        "type": "Metric",
        "props": props
    }


def table(
    key: str,
    columns: list[dict],
    data: list[dict],
    striped: bool = False
) -> tuple[str, dict]:
    """Create a Table element.

    Args:
        key: Unique element key
        columns: List of column definitions [{"key": "col_key", "label": "Column Label", "format": "text"}]
        data: List of row data dictionaries
        striped: Whether to use striped rows
    """
    return key, {
        "key": key,
        "type": "Table",
        "props": {
            "columns": columns,
            "data": data,
            "striped": striped
        }
    }


def chart(
    key: str,
    chart_type: str,
    data: list[dict],
    title: str = None,
    height: int = None
) -> tuple[str, dict]:
    """Create a Chart element.

    Args:
        key: Unique element key
        chart_type: Chart type ('bar', 'line', 'pie', 'area')
        data: List of data points [{"label": "Jan", "value": 100, "color": "#ff0000"}]
        title: Optional chart title
        height: Optional chart height in pixels
    """
    props = {
        "type": chart_type,
        "data": data,
    }
    if title:
        props["title"] = title
    if height:
        props["height"] = height

    return key, {
        "key": key,
        "type": "Chart",
        "props": props
    }


def progress(
    key: str,
    value: int,
    label: str = None,
    show_value: bool = False
) -> tuple[str, dict]:
    """Create a Progress element."""
    props = {"value": value}
    if label:
        props["label"] = label
    if show_value:
        props["showValue"] = show_value

    return key, {
        "key": key,
        "type": "Progress",
        "props": props
    }


def badge(
    key: str,
    text: str,
    variant: str = "default"
) -> tuple[str, dict]:
    """Create a Badge element."""
    return key, {
        "key": key,
        "type": "Badge",
        "props": {
            "text": text,
            "variant": variant
        }
    }


# ============================================
# Interactive Components
# ============================================

def button(
    key: str,
    label: str,
    action_name: str,
    action_params: dict = None,
    variant: str = "default",
    size: str = "default"
) -> tuple[str, dict]:
    """Create a Button element."""
    action = {"name": action_name}
    if action_params:
        action["params"] = action_params

    return key, {
        "key": key,
        "type": "Button",
        "props": {
            "label": label,
            "action": action,
            "variant": variant,
            "size": size
        }
    }


# ============================================
# Feedback Components
# ============================================

def alert(
    key: str,
    title: str,
    description: str = None,
    variant: str = "default"
) -> tuple[str, dict]:
    """Create an Alert element."""
    props = {"title": title, "variant": variant}
    if description:
        props["description"] = description

    return key, {
        "key": key,
        "type": "Alert",
        "props": props
    }


# ============================================
# Content Components
# ============================================

def text(
    key: str,
    content: str,
    variant: str = "p"
) -> tuple[str, dict]:
    """Create a Text element.

    Args:
        key: Unique element key
        content: Text content
        variant: Text style ('p', 'h1', 'h2', 'h3', 'muted', 'lead')
    """
    return key, {
        "key": key,
        "type": "Text",
        "props": {
            "content": content,
            "variant": variant
        }
    }


def image(
    key: str,
    src: str,
    alt: str,
    width: int = None,
    height: int = None
) -> tuple[str, dict]:
    """Create an Image element."""
    props = {"src": src, "alt": alt}
    if width:
        props["width"] = width
    if height:
        props["height"] = height

    return key, {
        "key": key,
        "type": "Image",
        "props": props
    }


def divider(
    key: str,
    orientation: str = "horizontal"
) -> tuple[str, dict]:
    """Create a Divider element."""
    return key, {
        "key": key,
        "type": "Divider",
        "props": {"orientation": orientation}
    }


def list_items(
    key: str,
    items: list[dict],
    ordered: bool = False
) -> tuple[str, dict]:
    """Create a List element.

    Args:
        key: Unique element key
        items: List of items [{"label": "Item 1", "value": "Value", "icon": "check"}]
        ordered: Whether to use ordered list
    """
    return key, {
        "key": key,
        "type": "List",
        "props": {
            "items": items,
            "ordered": ordered
        }
    }


# ============================================
# Filter/Form Components
# ============================================

def filter_panel(
    key: str,
    filters: list[dict],
    title: str = None,
    active_filters: dict = None
) -> tuple[str, dict]:
    """Create a FilterPanel element for database filtering.

    Args:
        key: Unique element key
        filters: List of filter definitions, each with:
            - id: Filter identifier
            - label: Display label
            - type: Filter type ('text', 'select', 'date', 'dateRange', 'checkbox', 'number')
            - placeholder: Optional placeholder text
            - options: For 'select' type, list of {"label": "...", "value": "..."}
            - value: Optional default value
        title: Optional panel title
        active_filters: Currently active filter values as {filter_id: value}

    Example:
        filter_panel("user-filters", [
            {"id": "name", "label": "Name", "type": "text", "placeholder": "Search by name..."},
            {"id": "status", "label": "Status", "type": "select", "options": [
                {"label": "Active", "value": "active"},
                {"label": "Inactive", "value": "inactive"}
            ]},
            {"id": "created_after", "label": "Created After", "type": "date"},
        ], title="Filter Users")
    """
    props = {"filters": filters}
    if title:
        props["title"] = title
    if active_filters:
        props["activeFilters"] = active_filters

    return key, {
        "key": key,
        "type": "FilterPanel",
        "props": props
    }


# ============================================
# Document Components
# ============================================

def document_preview(
    key: str,
    title: str,
    doc_type: str,
    sections: list[dict],
    status: str = None,
    metadata: dict = None
) -> tuple[str, dict]:
    """Create a DocumentPreview element for generated documents.

    Args:
        key: Unique element key
        title: Document title
        doc_type: Document type ('invoice', 'report', 'letter', 'contract', 'receipt', 'custom')
        sections: List of document sections, each with:
            - heading: Optional section heading
            - content: Section content (for lists, use newline-separated items)
            - type: Section type ('text', 'table', 'list', 'signature')
        status: Optional status ('draft', 'final', 'pending')
        metadata: Optional metadata as {key: value} displayed at top

    Example:
        document_preview("invoice-001", "Invoice #001", "invoice", [
            {"heading": "Bill To", "content": "John Doe\\n123 Main St"},
            {"heading": "Items", "content": "Product A - $100\\nProduct B - $50", "type": "list"},
            {"content": "Signature", "type": "signature"}
        ], status="final", metadata={"Date": "2024-01-15", "Due": "2024-02-15"})
    """
    props = {
        "title": title,
        "type": doc_type,
        "sections": sections,
    }
    if status:
        props["status"] = status
    if metadata:
        props["metadata"] = metadata

    return key, {
        "key": key,
        "type": "DocumentPreview",
        "props": props
    }


# ============================================
# Builder Helper
# ============================================

class UITreeBuilder:
    """Helper class to build UI trees fluently."""

    def __init__(self):
        self.elements = {}
        self.root_key = None

    def add(self, element_tuple: tuple[str, dict]) -> "UITreeBuilder":
        """Add an element to the tree."""
        key, element = element_tuple
        self.elements[key] = element
        if self.root_key is None:
            self.root_key = key
        return self

    def set_root(self, key: str) -> "UITreeBuilder":
        """Set the root element key."""
        self.root_key = key
        return self

    def build(self) -> dict:
        """Build the final UI tree."""
        return create_ui_tree(self.root_key, self.elements)
