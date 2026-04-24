-- Run this in your Supabase SQL Editor

create table if not exists survey_responses (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),

  consent          boolean not null,

  travel_satisfaction         smallint not null check (travel_satisfaction between 1 and 5),
  accommodation_satisfaction  smallint not null check (accommodation_satisfaction between 1 and 5),
  food_satisfaction           smallint not null check (food_satisfaction between 1 and 5),
  staff_satisfaction          smallint not null check (staff_satisfaction between 1 and 5),
  overall_satisfaction        smallint not null check (overall_satisfaction between 1 and 5),

  transportation_issues       text[] not null,
  accommodation_issues        text[] not null,
  food_coordination_issues    text[] not null,

  nps_score                   smallint not null check (nps_score between 0 and 10),

  how_heard                   text not null,

  would_participate_again     boolean not null,

  most_positive_aspect        text not null,
  areas_for_improvement       text not null,
  recommendation_reason       text not null
);

alter table survey_responses enable row level security;

create policy "service role full access"
  on survey_responses
  for all
  using (true)
  with check (true);
