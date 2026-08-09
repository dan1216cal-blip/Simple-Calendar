import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, CircleHelp, CirclePlus, Clock3, Crown, Home as HomeIcon, Leaf, Menu, Plus, Trash2, X } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

type CalendarEvent = {
  id: string;
  date: string;
  title: string;
  time?: string;
};

const queryClient = new QueryClient();
const STORAGE_KEY = 'small-hours-calendar-events';
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseDateKey(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function getMondayOffset(date: Date) {
  return (date.getDay() + 6) % 7;
}

function readEvents(): CalendarEvent[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) as CalendarEvent[] : [];
  } catch {
    return [];
  }
}

function Home() {
  const today = useMemo(() => new Date(), []);
  const todayKey = dateKey(today);
  const [events, setEvents] = useState<CalendarEvent[]>(readEvents);
  const [shownMonth, setShownMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [isAdding, setIsAdding] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const detailPanelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  const monthCells = useMemo(() => {
    const first = new Date(shownMonth.getFullYear(), shownMonth.getMonth(), 1);
    const daysInMonth = new Date(shownMonth.getFullYear(), shownMonth.getMonth() + 1, 0).getDate();
    const previousDays = new Date(shownMonth.getFullYear(), shownMonth.getMonth(), 0).getDate();
    const cells: { date: Date; inMonth: boolean }[] = [];
    const offset = getMondayOffset(first);
    for (let i = offset - 1; i >= 0; i -= 1) cells.push({ date: new Date(shownMonth.getFullYear(), shownMonth.getMonth() - 1, previousDays - i), inMonth: false });
    for (let day = 1; day <= daysInMonth; day += 1) cells.push({ date: new Date(shownMonth.getFullYear(), shownMonth.getMonth(), day), inMonth: true });
    let nextDay = 1;
    while (cells.length < 42) {
      cells.push({ date: new Date(shownMonth.getFullYear(), shownMonth.getMonth() + 1, nextDay), inMonth: false });
      nextDay += 1;
    }
    return cells;
  }, [shownMonth]);

  const selectedEvents = useMemo(
    () => events.filter((event) => event.date === selectedDate).sort((a, b) => (a.time || '').localeCompare(b.time || '')),
    [events, selectedDate],
  );
  const monthEventCount = events.filter((event) => {
    const d = parseDateKey(event.date);
    return d.getFullYear() === shownMonth.getFullYear() && d.getMonth() === shownMonth.getMonth();
  }).length;
  const selectedDateLabel = parseDateKey(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  function goToToday() {
    setShownMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(todayKey);
    setIsMobileMenuOpen(false);
  }

  function shiftMonth(amount: number) {
    setShownMonth(new Date(shownMonth.getFullYear(), shownMonth.getMonth() + amount, 1));
  }

  function chooseDate(key: string) {
    setSelectedDate(key);
    setIsAdding(false);
    setFeedback('');
  }

  function submitEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setEvents((current) => [...current, { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, date: selectedDate, title, time: newTime || undefined }]);
    setNewTitle('');
    setNewTime('');
    setIsAdding(false);
    setFeedback('Saved to your day');
    window.setTimeout(() => setFeedback(''), 2400);
  }

  function removeEvent(id: string) {
    setEvents((current) => current.filter((event) => event.id !== id));
    setFeedback('Event removed');
    window.setTimeout(() => setFeedback(''), 2400);
  }

  function openAddForm() {
    setIsHelpOpen(false);
    setIsAdding(true);
    window.setTimeout(() => detailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
  }

  function showIntention() {
    setIsHelpOpen(false);
    setFeedback('Make room for one meaningful thing');
    window.setTimeout(() => setFeedback(''), 2600);
  }

  return (
    <main className="calendar-app bg-[hsl(var(--background))]">
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[1480px]">
        <aside className={`${isMobileMenuOpen ? 'flex' : 'hidden'} fixed inset-0 z-30 flex-col bg-[hsl(var(--primary))] p-7 text-[hsl(var(--primary-foreground))] md:relative md:flex md:w-[250px] md:shrink-0 md:p-8`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[hsl(var(--accent))] text-[hsl(var(--foreground))]">
                <Leaf size={19} strokeWidth={2.3} />
              </div>
              <div>
                <p className="font-serif text-[19px] font-bold tracking-[-.02em]">small hours</p>
                <p className="font-mono text-[9px] uppercase tracking-[.18em] opacity-65">a quieter calendar</p>
              </div>
            </div>
            <button type="button" aria-label="Close menu" data-testid="button-close-menu" onClick={() => setIsMobileMenuOpen(false)} className="rounded-full p-2 hover:bg-white/10 md:hidden"><X size={19} /></button>
          </div>

          <div className="mt-20 hidden md:block">
            <p className="font-mono text-[10px] uppercase tracking-[.2em] opacity-55">Your space</p>
            <div className="mt-4 border-l border-white/25 pl-4">
              <p className="text-[13px] font-semibold">Month at a glance</p>
              <p className="mt-1 text-[12px] leading-5 opacity-65">Keep the days roomy. Make time for what matters.</p>
            </div>
          </div>

          <div className="mt-auto hidden md:block">
            <div className="rounded-2xl border border-white/15 bg-white/[.07] p-4">
              <p className="font-serif text-[16px]">A little intention<br />goes a long way.</p>
              <div className="mt-4 h-px bg-white/15" />
              <p className="mt-3 text-[11px] leading-5 opacity-60">Your events stay in this browser, close to hand and never in the cloud.</p>
            </div>
            <p className="mt-7 font-mono text-[9px] uppercase tracking-[.18em] opacity-45">made for the in-between</p>
          </div>
        </aside>

        <section className="page-enter min-w-0 flex-1 px-5 pb-12 pt-5 sm:px-8 sm:pt-7 lg:px-12 lg:pt-10">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3 md:hidden">
              <button type="button" aria-label="Open menu" data-testid="button-open-menu" onClick={() => setIsMobileMenuOpen(true)} className="icon-button rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2.5 text-[hsl(var(--foreground))]"><Menu size={18} /></button>
              <span className="font-serif text-[18px] font-bold">small hours</span>
            </div>
            <div className="hidden md:block">
              <p className="font-mono text-[10px] uppercase tracking-[.22em] text-[hsl(var(--muted-foreground))]">{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              <h1 className="mt-2 font-serif text-[clamp(28px,3vw,42px)] font-bold leading-none tracking-[-.045em]">Make room for today.</h1>
            </div>
            <button type="button" data-testid="button-today" onClick={goToToday} className="rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2 text-[12px] font-bold text-[hsl(var(--foreground))] transition hover:-translate-y-0.5 hover:border-[hsl(var(--primary)/.5)] hover:shadow-[var(--shadow-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]">Today</button>
          </header>

          <div className="mt-8 grid gap-7 xl:grid-cols-[minmax(0,1fr)_310px] xl:gap-10">
            <div>
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[.2em] text-[hsl(var(--muted-foreground))]">Month / {shownMonth.getFullYear()}</p>
                  <h2 data-testid="text-current-month" className="mt-1 font-serif text-[34px] font-bold leading-none tracking-[-.04em] sm:text-[42px]">{MONTHS[shownMonth.getMonth()]}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="mr-2 hidden font-mono text-[10px] uppercase tracking-[.12em] text-[hsl(var(--muted-foreground))] sm:inline">{monthEventCount} {monthEventCount === 1 ? 'moment' : 'moments'}</span>
                  <button type="button" aria-label="Previous month" data-testid="button-previous-month" onClick={() => shiftMonth(-1)} className="icon-button rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2.5 transition hover:-translate-x-0.5 hover:border-[hsl(var(--primary)/.5)]"><ChevronLeft size={17} /></button>
                  <button type="button" aria-label="Next month" data-testid="button-next-month" onClick={() => shiftMonth(1)} className="icon-button rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2.5 transition hover:translate-x-0.5 hover:border-[hsl(var(--primary)/.5)]"><ChevronRight size={17} /></button>
                </div>
              </div>

              <div className="overflow-hidden rounded-[20px] border border-[hsl(var(--border))] bg-[hsl(var(--card)/.65)] soft-shadow">
                <div className="grid grid-cols-7 border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary)/.42)]">
                  {WEEKDAYS.map((day, index) => <div key={day} className={`py-3 text-center font-mono text-[10px] uppercase tracking-[.12em] ${index > 4 ? 'text-[hsl(var(--accent)/.95)]' : 'text-[hsl(var(--muted-foreground))]'}`}>{day}</div>)}
                </div>
                <div className="calendar-grid grid grid-cols-7 gap-px bg-[hsl(var(--border))]">
                  {monthCells.map(({ date, inMonth }) => {
                    const key = dateKey(date);
                    const dayEvents = events.filter((event) => event.date === key);
                    return (
                      <button key={key} type="button" data-testid={`button-date-${key}`} onClick={() => chooseDate(key)} className={`calendar-cell group relative min-h-[102px] bg-[hsl(var(--card))] p-2 text-left sm:min-h-[122px] sm:p-3 ${!inMonth ? 'opacity-40' : ''} ${key === selectedDate ? 'is-selected' : ''} ${key === todayKey ? 'is-today' : ''}`}>
                        <span className="day-number inline-flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 font-mono text-[11px] font-medium">{date.getDate()}</span>
                        {dayEvents.length > 0 && <div className="mt-2 space-y-1">
                          {dayEvents.slice(0, 2).map((event) => <div key={event.id} className="event-pill truncate rounded-md bg-[hsl(var(--primary)/.11)] px-1.5 py-1 text-[10px] font-semibold text-[hsl(var(--primary))]">{event.title}</div>)}
                          {dayEvents.length > 2 && <p className="pl-1 text-[9px] font-bold text-[hsl(var(--muted-foreground))]">+{dayEvents.length - 2} more</p>}
                        </div>}
                        {dayEvents.length === 0 && inMonth && <span className="absolute bottom-3 right-3 hidden text-[14px] text-[hsl(var(--primary)/.35)] transition group-hover:block">+</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <aside ref={detailPanelRef} className="drawer-enter xl:pt-8">
              <div className="rounded-[20px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 soft-shadow sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">Selected day</p>
                    <h3 data-testid="text-selected-date" className="mt-2 font-serif text-[25px] font-bold leading-[1.08] tracking-[-.03em]">{selectedDateLabel}</h3>
                  </div>
                  <div className="rounded-xl bg-[hsl(var(--accent)/.18)] p-2 text-[hsl(var(--accent-foreground))]"><Clock3 size={17} /></div>
                </div>
                <div className="my-5 h-px bg-[hsl(var(--border))]" />

                {selectedEvents.length > 0 ? <div className="space-y-2.5">
                  {selectedEvents.map((event) => <div key={event.id} className="event-row group flex items-start gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background)/.55)] p-3 transition hover:border-[hsl(var(--primary)/.35)]" data-testid={`event-row-${event.id}`}>
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[hsl(var(--accent))]" />
                    <div className="min-w-0 flex-1">
                      <p data-testid={`text-event-${event.id}`} className="truncate text-[13px] font-bold">{event.title}</p>
                      {event.time && <p className="mt-1 font-mono text-[10px] text-[hsl(var(--muted-foreground))]">{event.time}</p>}
                    </div>
                    <button type="button" aria-label={`Delete ${event.title}`} data-testid={`button-delete-event-${event.id}`} onClick={() => removeEvent(event.id)} className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] opacity-0 transition hover:bg-[hsl(var(--destructive)/.12)] hover:text-[hsl(var(--destructive))] group-hover:opacity-100 focus:opacity-100"><Trash2 size={15} /></button>
                  </div>)}
                </div> : <div data-testid="empty-selected-day" className="rounded-xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--background)/.5)] px-4 py-6 text-center">
                  <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"><Leaf size={16} /></div>
                  <p className="mt-3 text-[13px] font-bold">A clear stretch of day</p>
                  <p className="mx-auto mt-1 max-w-[190px] text-[11px] leading-5 text-[hsl(var(--muted-foreground))]">Nothing here yet. Keep it open, or add one meaningful thing.</p>
                </div>}

                {isAdding ? <form onSubmit={submitEvent} className="mt-5 rounded-xl bg-[hsl(var(--secondary)/.55)] p-4" data-testid="form-add-event">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[12px] font-bold">Add a moment</p>
                    <button type="button" aria-label="Cancel adding event" data-testid="button-cancel-add" onClick={() => setIsAdding(false)} className="rounded-full p-1 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--card))]"><X size={14} /></button>
                  </div>
                  <input autoFocus required value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="What matters today?" data-testid="input-event-title" className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2.5 text-[12px] outline-none transition placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--ring)/.15)]" />
                  <div className="mt-2 flex gap-2">
                    <input type="time" value={newTime} onChange={(event) => setNewTime(event.target.value)} data-testid="input-event-time" className="min-w-0 flex-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-[11px] outline-none focus:border-[hsl(var(--primary))]" />
                    <button type="submit" data-testid="button-save-event" className="primary-button rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-[11px] font-bold text-[hsl(var(--primary-foreground))] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]">Save</button>
                  </div>
                </form> : <button type="button" data-testid="button-add-event" onClick={() => setIsAdding(true)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[hsl(var(--primary)/.45)] bg-[hsl(var(--primary)/.06)] py-3 text-[12px] font-bold text-[hsl(var(--primary))] transition hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/.12)]"><CirclePlus size={16} /> Add to this day</button>}
                {feedback && <p role="status" data-testid="status-feedback" className="mt-3 text-center font-mono text-[9px] uppercase tracking-[.12em] text-[hsl(var(--primary))]">{feedback}</p>}
              </div>
              <button type="button" data-testid="button-add-event-secondary" onClick={() => setIsAdding(true)} className="mt-4 hidden w-full items-center justify-center gap-2 rounded-xl py-2 text-[11px] font-bold text-[hsl(var(--muted-foreground))] transition hover:text-[hsl(var(--primary))] sm:flex"><Plus size={14} /> Plan another moment</button>
            </aside>
          </div>
        </section>

        <nav aria-label="Mobile navigation" className="mobile-bottom-nav fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-[22px] border border-[hsl(var(--border))] bg-[hsl(var(--card)/.94)] p-2 shadow-[var(--shadow-md)] backdrop-blur-md md:hidden">
          <button type="button" aria-label="Go to today" data-testid="button-mobile-home" onClick={goToToday} className="mobile-nav-button">
            <HomeIcon size={19} strokeWidth={2.2} />
            <span>Home</span>
          </button>
          <button type="button" aria-label="Add event" data-testid="button-mobile-add" onClick={openAddForm} className="mobile-nav-button mobile-nav-add">
            <Plus size={22} strokeWidth={2.5} />
            <span>Add</span>
          </button>
          <button type="button" aria-label="Set an intention" data-testid="button-mobile-crown" onClick={showIntention} className="mobile-nav-button">
            <Crown size={19} strokeWidth={2.1} />
            <span>Focus</span>
          </button>
          <button type="button" aria-label="How to use the calendar" data-testid="button-mobile-help" onClick={() => setIsHelpOpen((open) => !open)} className="mobile-nav-button">
            <CircleHelp size={19} strokeWidth={2.1} />
            <span>Help</span>
          </button>
        </nav>

        {isHelpOpen && <div className="mobile-help-sheet fixed inset-x-3 bottom-[88px] z-40 rounded-[18px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-[var(--shadow-md)] md:hidden" data-testid="mobile-help-sheet">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-[hsl(var(--secondary))] p-2 text-[hsl(var(--primary))]"><CircleHelp size={17} /></div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold">A little help</p>
              <p className="mt-1 text-[11px] leading-5 text-[hsl(var(--muted-foreground))]">Tap a date to see its moments. Use Add to save something to the selected day.</p>
            </div>
            <button type="button" aria-label="Close help" data-testid="button-close-mobile-help" onClick={() => setIsHelpOpen(false)} className="rounded-full p-1 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]"><X size={15} /></button>
          </div>
        </div>}
      </div>
    </main>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;