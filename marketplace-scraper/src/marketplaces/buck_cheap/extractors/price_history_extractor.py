"""
Price history extractor for Buck.cheap website.

This module provides functions for extracting historical price data from
Buck.cheap's product detail pages.
"""

import re
from datetime import datetime
from typing import Dict, List, Any, Optional
from bs4 import BeautifulSoup


def extract_price_history(html_content: str) -> List[Dict[str, Any]]:
    """Extract price history from Buck.cheap product page HTML.
    
    Args:
        html_content: HTML content of the product page
        
    Returns:
        List of price history points
    """
    # Parse HTML
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Find price history section
    history_section = soup.select_one('.price-history, .history-section, .timeline')
    
    if not history_section:
        # Try alternative selectors if the main one doesn't find anything
        history_section = soup.select_one('section:has(.price-change), div:has(.price-change), .history-list')
        
    if not history_section:
        # If we still can't find a specific history section, use the whole page
        history_section = soup
    
    # Extract price history events
    return _extract_price_events(history_section)


def _extract_price_events(soup: BeautifulSoup) -> List[Dict[str, Any]]:
    """Extract price change events from the soup object.
    
    Args:
        soup: BeautifulSoup object containing price history
        
    Returns:
        List of price change events
    """
    price_events = []
    
    # Try multiple selectors for price change events
    event_elements = soup.select('.price-event, .price-change, .history-item, .timeline-item')
    
    if not event_elements:
        # Try alternative selectors
        event_elements = soup.select('tr:has(.price), li:has(.price-change), .event')
    
    for event in event_elements:
        try:
            # Extract date
            date_element = event.select_one('.event-date, .date, time, [datetime]')
            event_date = None
            
            if date_element:
                # Try to get date from datetime attribute
                if date_element.get('datetime'):
                    try:
                        event_date = date_element['datetime'].split('T')[0]  # Get date part only
                    except:
                        pass
                
                # If that fails, try parsing from text
                if not event_date:
                    date_text = date_element.text.strip()
                    event_date = _parse_date_text(date_text)
            
            # If we couldn't find a date, skip this event
            if not event_date:
                continue
            
            # Extract price change information
            price_element = event.select_one('.price, .new-price, [itemprop="price"]')
            price = None
            
            if price_element:
                price_text = price_element.text.strip()
                price_match = re.search(r'R\s*(\d+(?:[.,]\d+)?)', price_text)
                if price_match:
                    try:
                        price_str = price_match.group(1).replace(',', '.')
                        price = float(price_str)
                    except ValueError:
                        pass
            
            # Extract previous price if available
            prev_price_element = event.select_one('.previous-price, .old-price, del')
            prev_price = None
            
            if prev_price_element:
                price_text = prev_price_element.text.strip()
                price_match = re.search(r'R\s*(\d+(?:[.,]\d+)?)', price_text)
                if price_match:
                    try:
                        price_str = price_match.group(1).replace(',', '.')
                        prev_price = float(price_str)
                    except ValueError:
                        pass
            
            # Extract stock status information
            stock_status = None
            stock_element = event.select_one('.stock-status, .availability')
            if stock_element:
                stock_text = stock_element.text.strip().lower()
                if any(term in stock_text for term in ['in stock', 'available']):
                    stock_status = 'in_stock'
                elif any(term in stock_text for term in ['out of stock', 'unavailable', 'sold out']):
                    stock_status = 'out_of_stock'
            
            # Create price event
            price_event = {
                "date": event_date
            }
            
            if price is not None:
                price_event["price"] = price
                price_event["currency"] = "ZAR"
            
            if prev_price is not None:
                price_event["previous_price"] = prev_price
                
                # Calculate change amount and percentage
                if price is not None:
                    price_event["change"] = price - prev_price
                    price_event["change_percentage"] = (price_event["change"] / prev_price) * 100
            
            if stock_status:
                price_event["stock_status"] = stock_status
            
            # Try to extract event description or reason
            description_element = event.select_one('.event-description, .description, .note')
            if description_element:
                price_event["description"] = description_element.text.strip()
            
            price_events.append(price_event)
            
        except Exception as e:
            print(f"Error extracting price event: {e}")
            continue
    
    # Sort by date
    price_events.sort(key=lambda x: x.get("date", ""))
    
    return price_events


def _parse_date_text(date_text: str) -> Optional[str]:
    """Parse date text into ISO format date string.
    
    Args:
        date_text: Date text from the page
        
    Returns:
        ISO format date string (YYYY-MM-DD) or None if unparseable
    """
    # Clean up text
    date_text = date_text.strip().lower()
    
    # Handle relative dates
    if 'today' in date_text:
        return datetime.now().strftime('%Y-%m-%d')
    
    if 'yesterday' in date_text:
        from datetime import timedelta
        return (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
    
    # Handle "X days ago", "X months ago", "X years ago"
    ago_match = re.search(r'(\d+)\s+(day|month|year)s?\s+ago', date_text)
    if ago_match:
        amount = int(ago_match.group(1))
        unit = ago_match.group(2)
        
        from datetime import timedelta
        
        if unit == 'day':
            return (datetime.now() - timedelta(days=amount)).strftime('%Y-%m-%d')
        elif unit == 'month':
            # Approximate month as 30 days
            return (datetime.now() - timedelta(days=amount*30)).strftime('%Y-%m-%d')
        elif unit == 'year':
            # Approximate year as 365 days
            return (datetime.now() - timedelta(days=amount*365)).strftime('%Y-%m-%d')
    
    # Try to parse absolute dates
    date_formats = [
        # Common date formats
        '%Y-%m-%d',              # 2024-04-17
        '%d/%m/%Y',              # 17/04/2024
        '%d-%m-%Y',              # 17-04-2024
        '%m/%d/%Y',              # 04/17/2024
        '%b %d, %Y',             # Apr 17, 2024
        '%d %b %Y',              # 17 Apr 2024
        '%B %d, %Y',             # April 17, 2024
        '%d %B %Y',              # 17 April 2024
        '%a, %d %b %Y',          # Wed, 17 Apr 2024
        '%a %b %d %Y',           # Wed Apr 17 2024
        '%Y/%m/%d',              # 2024/04/17
    ]
    
    for date_format in date_formats:
        try:
            date_obj = datetime.strptime(date_text, date_format)
            return date_obj.strftime('%Y-%m-%d')
        except ValueError:
            continue
    
    # Try to extract date with regex
    date_patterns = [
        # Match patterns like "17 April 2024" or "April 17, 2024"
        r'(\d{1,2})[/\s.-]+([A-Za-z]+)[/\s,-]+(\d{4})',
        r'([A-Za-z]+)[/\s,-]+(\d{1,2})[/\s,-]+(\d{4})',
        # Match numeric patterns like "2024-04-17" or "17/04/2024"
        r'(\d{4})[/\s.-]+(\d{1,2})[/\s.-]+(\d{1,2})',
        r'(\d{1,2})[/\s.-]+(\d{1,2})[/\s.-]+(\d{4})'
    ]
    
    for pattern in date_patterns:
        match = re.search(pattern, date_text)
        if match:
            try:
                groups = match.groups()
                if len(groups) == 3:
                    # Determine if first group is day, month or year
                    if re.match(r'\d{4}', groups[0]):  # First group is year
                        year, month, day = groups
                    elif re.match(r'[A-Za-z]+', groups[0]):  # First group is month name
                        month, day, year = groups
                        # Convert month name to number
                        month_names = {'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6, 
                                     'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12}
                        month = month_names.get(month[:3].lower(), 1)
                    else:  # First group is day
                        day, month, year = groups
                        # If month is a name, convert to number
                        if re.match(r'[A-Za-z]+', month):
                            month_names = {'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6, 
                                          'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12}
                            month = month_names.get(month[:3].lower(), 1)
                            
                    # Ensure values are integers
                    year, month, day = int(year), int(month) if isinstance(month, (int, str)) and month.isdigit() else month, int(day)
                    
                    # Fix potential year issues (e.g., 2-digit years)
                    if year < 100:
                        year += 2000 if year < 50 else 1900
                        
                    # Create date object and return ISO format
                    return datetime(year, month, day).strftime('%Y-%m-%d')
            except (ValueError, TypeError):
                continue
    
    # Couldn't parse the date
    return None