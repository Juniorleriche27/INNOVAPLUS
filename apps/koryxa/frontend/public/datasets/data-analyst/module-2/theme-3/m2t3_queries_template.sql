-- QUERY:q1_funnel_by_theme
-- Grain résultat: 1 ligne = 1 theme
-- Objectif: compter les événements opened_theme par theme (1..5), tri décroissant
SELECT
  theme,
  COUNT(*) AS opened_theme_events
FROM events
WHERE event_type = 'opened_theme'
GROUP BY theme
ORDER BY opened_theme_events DESC;
-- ENDQUERY


-- QUERY:q2_completion_by_country
-- Grain résultat: 1 ligne = 1 country
-- Objectif: completion_rate = validated_users / enrolled_users par country
WITH enrolled AS (
  SELECT DISTINCT e.user_id, p.country
  FROM events e
  LEFT JOIN profiles p ON e.user_id = p.user_id
  WHERE e.event_type = 'enrolled'
),
validated AS (
  SELECT DISTINCT e.user_id, p.country
  FROM events e
  LEFT JOIN profiles p ON e.user_id = p.user_id
  WHERE e.event_type = 'validated'
)
SELECT
  enrolled.country,
  COUNT(DISTINCT validated.user_id) * 1.0 / NULLIF(COUNT(DISTINCT enrolled.user_id), 0) AS completion_rate
FROM enrolled
LEFT JOIN validated
  ON enrolled.user_id = validated.user_id
GROUP BY enrolled.country
HAVING COUNT(DISTINCT enrolled.user_id) >= 5
ORDER BY completion_rate DESC;
-- ENDQUERY


-- QUERY:q3_notebook48h_vs_validation
-- Grain résultat: 1 ligne = 1 segment (opened_notebook_48h vs not_opened_48h)
-- Objectif: comparer la validation entre ceux qui ouvrent le notebook vite vs non
WITH first_enroll AS (
  SELECT user_id, MIN(event_time) AS enroll_time
  FROM events
  WHERE event_type = 'enrolled'
  GROUP BY user_id
),
opened_48h AS (
  SELECT e.user_id
  FROM events e
  JOIN first_enroll fe ON e.user_id = fe.user_id
  WHERE e.event_type = 'opened_notebook'
    AND (julianday(e.event_time) - julianday(fe.enroll_time)) * 24 <= 48
  GROUP BY e.user_id
),
validated AS (
  SELECT DISTINCT user_id
  FROM events
  WHERE event_type = 'validated'
)
SELECT
  CASE WHEN o.user_id IS NOT NULL THEN 'opened_notebook_48h' ELSE 'not_opened_48h' END AS segment,
  COUNT(DISTINCT fe.user_id) AS enrolled_users,
  COUNT(DISTINCT v.user_id) AS validated_users,
  COUNT(DISTINCT v.user_id) * 1.0 / NULLIF(COUNT(DISTINCT fe.user_id), 0) AS completion_rate
FROM first_enroll fe
LEFT JOIN opened_48h o ON fe.user_id = o.user_id
LEFT JOIN validated v ON fe.user_id = v.user_id
GROUP BY segment;
-- ENDQUERY

