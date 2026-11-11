-- Sample data for testing the Job Tracker.
--
-- Apply with: npm run db:seed
--
-- Every row belongs to a user, so this gives EACH existing account
-- (auth.users) the same set of sample applications and tasks. Sign up first,
-- then seed. Dates are relative to today, so due dates always look current.
--
-- Safe to run more than once: rows that already exist (same company and
-- position, or same task title on an application) are skipped.
-- All sample companies are fictional; every sample application's notes start
-- with "[sample]". To remove them, delete the applications in the app
-- (their tasks are deleted with them).

insert into public.applications (user_id, company, position, status, applied_on, notes)
select u.id, s.company, s.position, s.status, current_date - s.days_ago, s.notes
from auth.users u
cross join (values
  ('Northwind Labs',     'Frontend Developer',        'interviewing', 21,   '[sample] Referred by a former colleague. Second round is a pairing session.'),
  ('Bluebird Analytics', 'Full Stack Engineer',       'applied',      5,    '[sample] Remote-first, team in Lisbon.'),
  ('Cobalt Health',      'Software Engineer II',      'offer',        40,   '[sample] Offer received; decision due soon.'),
  ('Lumen Payments',     'Backend Engineer',          'rejected',     60,   '[sample] Rejected after the take-home. Feedback: more tests.'),
  ('Fernway Logistics',  'React Developer',           'applied',      2,    '[sample] Applied through their careers page.'),
  ('Quarry Games',       'Web Platform Engineer',     'interviewing', 14,   '[sample] Recruiter call went well; technical interview next.'),
  ('Tidepool Energy',    'Junior Developer',          'rejected',     35,   '[sample] Position filled internally.'),
  ('Helio Maps',         'Next.js Developer',         'applied',      null, '[sample] Draft — not sent yet, no application date.')
) as s(company, position, status, days_ago, notes)
where not exists (
  select 1 from public.applications a
  where a.user_id = u.id and a.company = s.company and a.position = s.position
);

insert into public.tasks (user_id, application_id, title, due_date, done)
select a.user_id, a.id, t.title, current_date + t.due_in, t.done
from (values
  ('Northwind Labs',     'Frontend Developer',    'Prepare for pairing session',        2,    false),
  ('Northwind Labs',     'Frontend Developer',    'Send thank-you email to recruiter',  -5,   true),
  ('Northwind Labs',     'Frontend Developer',    'Review their design system docs',    1,    false),
  ('Bluebird Analytics', 'Full Stack Engineer',   'Follow up if no reply',              7,    false),
  ('Cobalt Health',      'Software Engineer II',  'Compare offer with current salary',  -1,   true),
  ('Cobalt Health',      'Software Engineer II',  'Reply to offer',                     3,    false),
  ('Cobalt Health',      'Software Engineer II',  'Ask about remote work policy',       null, false),
  ('Lumen Payments',     'Backend Engineer',      'Submit take-home assignment',        -45,  true),
  ('Lumen Payments',     'Backend Engineer',      'Write down lessons learned',         null, true),
  ('Fernway Logistics',  'React Developer',       'Connect with hiring manager',        4,    false),
  ('Quarry Games',       'Web Platform Engineer', 'Practice system design questions',   -2,   false),
  ('Quarry Games',       'Web Platform Engineer', 'Confirm interview time',             0,    false),
  ('Quarry Games',       'Web Platform Engineer', 'Research the team on LinkedIn',      -7,   true),
  ('Helio Maps',         'Next.js Developer',     'Tailor CV for this role',            1,    false),
  ('Helio Maps',         'Next.js Developer',     'Write cover letter',                 3,    false)
) as t(company, position, title, due_in, done)
join public.applications a
  on a.company = t.company and a.position = t.position
where not exists (
  select 1 from public.tasks x
  where x.application_id = a.id and x.title = t.title
);
