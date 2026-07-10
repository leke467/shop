"""Pagination classes tuned for large catalogs."""
from __future__ import annotations

from rest_framework.pagination import CursorPagination, PageNumberPagination
from rest_framework.response import Response


class DefaultPagination(PageNumberPagination):
    """Page-number pagination with a client-capped page size.

    Suitable for admin tables and modest lists. For very large, frequently
    appended feeds prefer :class:`FeedCursorPagination`, which stays O(1) at
    any offset instead of degrading on deep pages.
    """

    page_size = 24
    page_size_query_param = "page_size"
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response(
            {
                "count": self.page.paginator.count,
                "total_pages": self.page.paginator.num_pages,
                "current_page": self.page.number,
                "page_size": self.get_page_size(self.request),
                "next": self.get_next_link(),
                "previous": self.get_previous_link(),
                "results": data,
            }
        )


class FeedCursorPagination(CursorPagination):
    """Cursor pagination for infinite-scroll feeds (products, personalization).

    Cursor pagination avoids the ``OFFSET`` performance cliff and is stable
    when new rows are inserted while a user scrolls.
    """

    page_size = 24
    page_size_query_param = "page_size"
    max_page_size = 100
    ordering = "-created_at"
