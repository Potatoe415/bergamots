// Public Supabase project values (safe to expose to the browser): access to
// game rows is blocked by Row Level Security, not by keeping these secret.
// This project ("multigames-db") is shared with coinchapp; Yatzy's tables
// are namespaced (yatzy_games, yatzy_game_events) to avoid collisions.
window.supabaseConfig = {
  url: "https://bpkituleqxhpqoojfegu.supabase.co",
  anonKey: "sb_publishable_es6QfUaGUyVaS0nwmWg5bA_JRleLqBH"
};
