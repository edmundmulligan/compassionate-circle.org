/**
 * Events Calendar – interactive monthly calendar with event data
 */
(function () {
  'use strict';

  /* ── Sample events data ──────────────────────────────────────
     In a real deployment these could be loaded from an API or
     a JSON file. Dates use ISO format YYYY-MM-DD.
  ────────────────────────────────────────────────────────────── */
  var EVENTS = [
    {
      date: offsetDate(0, 6),   // 6 days from today
      title: 'Compassion Circle',
      time: '10:00 – 11:30',
      location: 'Community Hall, Room 4',
      description: 'A gentle group circle for sharing and support. All are welcome.'
    },
    {
      date: offsetDate(0, 9),
      title: 'Mindfulness Meditation',
      time: '18:30 – 19:30',
      location: 'Online (Zoom)',
      description: 'Guided meditation session focused on breath awareness and presence.'
    },
    {
      date: offsetDate(0, 14),
      title: 'Introductory Workshop',
      time: '09:30 – 13:00',
      location: 'Community Hall, Main Room',
      description: 'Half-day workshop introducing compassion-focused practices.'
    },
    {
      date: offsetDate(0, 17),
      title: 'Compassion Circle',
      time: '10:00 – 11:30',
      location: 'Community Hall, Room 4',
      description: 'Weekly group circle session.'
    },
    {
      date: offsetDate(0, 21),
      title: 'One-to-One Clinic',
      time: '14:00 – 17:00',
      location: 'Wellness Centre',
      description: 'Drop-in clinic for individual 30-minute sessions with a facilitator.'
    },
    {
      date: offsetDate(1, 3),   // early next month
      title: 'Compassion Circle',
      time: '10:00 – 11:30',
      location: 'Community Hall, Room 4',
      description: 'Weekly group circle session.'
    },
    {
      date: offsetDate(1, 10),
      title: 'Mindfulness Meditation',
      time: '18:30 – 19:30',
      location: 'Online (Zoom)',
      description: 'Guided meditation for presence and calm.'
    }
  ];

  /**
   * Return an ISO date string offset from today.
   * @param {number} monthOffset - months relative to current month
   * @param {number} dayOffset   - days relative to the 1st of the resulting month
   * @returns {string} YYYY-MM-DD
   */
  function offsetDate(monthOffset, dayOffset) {
    var d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    d.setDate(dayOffset);
    return d.toISOString().split('T')[0];
  }

  var MONTH_NAMES = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var currentYear  = today.getFullYear();
  var currentMonth = today.getMonth(); // 0-based

  /* ── Build event lookup map ─────────────────────────────────── */
  var eventMap = {};
  EVENTS.forEach(function (ev) {
    if (!eventMap[ev.date]) eventMap[ev.date] = [];
    eventMap[ev.date].push(ev);
  });

  /* ── DOM references ─────────────────────────────────────────── */
  var heading        = document.getElementById('calendar-heading');
  var daysContainer  = document.getElementById('calendar-days');
  var listContainer  = document.getElementById('events-list-container');
  var prevBtn        = document.getElementById('prev-month');
  var nextBtn        = document.getElementById('next-month');

  if (!heading || !daysContainer || !listContainer) return;

  /* ── Render functions ───────────────────────────────────────── */

  /**
   * Zero-pad a number to two digits.
   * @param {number} n
   * @returns {string}
   */
  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  /**
   * Build a YYYY-MM-DD string from year, month (0-based), day.
   */
  function isoDate(year, month, day) {
    return year + '-' + pad(month + 1) + '-' + pad(day);
  }

  function renderCalendar(year, month) {
    heading.textContent = MONTH_NAMES[month] + ' ' + year;
    daysContainer.innerHTML = '';

    var firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    /* Adjust so week starts Monday: Mon=0 … Sun=6 */
    var startOffset = (firstDay === 0) ? 6 : firstDay - 1;
    var daysInMonth  = new Date(year, month + 1, 0).getDate();
    var daysInPrev   = new Date(year, month, 0).getDate();

    var cells = [];

    /* Previous month padding */
    for (var p = startOffset - 1; p >= 0; p--) {
      cells.push({ day: daysInPrev - p, thisMonth: false, prevMonth: true });
    }

    /* Current month */
    for (var d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, thisMonth: true });
    }

    /* Next month padding to complete the grid */
    var remainder = cells.length % 7;
    if (remainder > 0) {
      for (var n = 1; n <= 7 - remainder; n++) {
        cells.push({ day: n, thisMonth: false, nextMonth: true });
      }
    }

    cells.forEach(function (cell) {
      var div = document.createElement('div');
      div.className = 'calendar-day' + (!cell.thisMonth ? ' other-month' : '');

      var dayDate = cell.thisMonth
        ? isoDate(year, month, cell.day)
        : '';

      var numberDiv = document.createElement('div');
      numberDiv.className = 'day-number';

      var cellDate = new Date(year, month, cell.thisMonth ? cell.day : -1);
      if (cell.thisMonth && cellDate.getTime() === today.getTime()) {
        numberDiv.classList.add('today');
      }

      numberDiv.textContent = cell.day;
      div.appendChild(numberDiv);

      /* Add event dots */
      if (cell.thisMonth && eventMap[dayDate]) {
        eventMap[dayDate].forEach(function (ev) {
          var dot = document.createElement('span');
          dot.className = 'event-dot';
          dot.textContent = ev.title;
          dot.title = ev.time + ' – ' + ev.location;
          div.appendChild(dot);
        });
      }

      daysContainer.appendChild(div);
    });

    renderEventList(year, month);
  }

  function renderEventList(year, month) {
    listContainer.innerHTML = '';

    var monthEvents = EVENTS.filter(function (ev) {
      var d = new Date(ev.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    /* Sort ascending */
    monthEvents.sort(function (a, b) { return a.date.localeCompare(b.date); });

    if (monthEvents.length === 0) {
      listContainer.innerHTML = '<p style="color:var(--color-muted)">No events scheduled for this month.</p>';
      return;
    }

    monthEvents.forEach(function (ev) {
      var d = new Date(ev.date);
      var monthAbbr = MONTH_NAMES[d.getMonth()].slice(0, 3);
      var dayNum    = d.getDate();

      var item = document.createElement('div');
      item.className = 'event-item';
      item.innerHTML =
        '<div class="event-date-badge">' +
          '<div class="month">' + monthAbbr + '</div>' +
          '<div class="day">'   + dayNum    + '</div>' +
        '</div>' +
        '<div class="event-info">' +
          '<h4>' + escapeHtml(ev.title) + '</h4>' +
          '<p>'  + escapeHtml(ev.description) + '</p>' +
          '<p class="event-meta">&#128336; ' + escapeHtml(ev.time) +
            ' &nbsp;&bull;&nbsp; &#128205; ' + escapeHtml(ev.location) + '</p>' +
          '<a href="booking.html" class="btn btn-primary" style="margin-top:0.75rem;padding:0.45rem 1rem;font-size:0.9rem;">Book a Place</a>' +
        '</div>';

      listContainer.appendChild(item);
    });
  }

  /**
   * Escape HTML special characters to prevent XSS.
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ── Navigation ─────────────────────────────────────────────── */
  prevBtn.addEventListener('click', function () {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar(currentYear, currentMonth);
  });

  nextBtn.addEventListener('click', function () {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderCalendar(currentYear, currentMonth);
  });

  /* Initial render */
  renderCalendar(currentYear, currentMonth);
}());
