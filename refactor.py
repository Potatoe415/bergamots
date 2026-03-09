import os
import shutil
from pathlib import Path

def main():
    # 1. Define Root Directory
    root_dir = Path.cwd()
    print(f"Starting refactor in: {root_dir}")

    apps_dir = root_dir / "apps"
    games_dir = root_dir / "games"
    public_games_assets = root_dir / "public" / "assets" / "games"

    # 2. Rename 'apps' to 'games'
    if apps_dir.exists():
        apps_dir.rename(games_dir)
        print("✅ Renamed 'apps/' to 'games/'")
    elif not games_dir.exists():
        print("❌ Could not find 'apps/' or 'games/' directory. Aborting.")
        return

    # 3. Move 'hub' contents to root and delete 'hub'
    hub_dir = games_dir / "hub"
    if hub_dir.exists():
        for item in hub_dir.iterdir():
            dest = root_dir / item.name
            if dest.exists():
                print(f"⚠️ Conflict: {dest.name} already exists at root. Overwriting.")
                if dest.is_dir():
                    shutil.rmtree(dest)
                else:
                    dest.unlink()
            shutil.move(str(item), str(dest))
        hub_dir.rmdir()
        print("✅ Moved hub dashboard files to root and deleted 'hub/' folder")

    # 4. Process each game folder
    for game_path in games_dir.iterdir():
        if not game_path.is_dir():
            continue

        game_name = game_path.name
        
        # Create standard folders
        assets_dir = game_path / "assets"
        config_dir = game_path / "config"
        assets_dir.mkdir(exist_ok=True)
        config_dir.mkdir(exist_ok=True)
        print(f"✅ Created architecture for game: {game_name}")

        # Move thumbnails from public to game assets
        if public_games_assets.exists():
            for ext in ['.jpg', '.png', '.webp', '.jpeg']:
                thumb = public_games_assets / f"{game_name}{ext}"
                if thumb.exists():
                    shutil.move(str(thumb), str(assets_dir / f"thumbnail{ext}"))
                    print(f"   -> Moved thumbnail for {game_name}")

        # Handle Pictionary-specific files
        if game_name == "pictionary":
            top_img = game_path / "pictionary_top.jpg"
            if top_img.exists():
                shutil.move(str(top_img), str(assets_dir / "pictionary_top.jpg"))
                print("   -> Moved pictionary_top.jpg")
            
            csv_file = game_path / "pictionary_words.csv"
            if csv_file.exists():
                shutil.move(str(csv_file), str(config_dir / "pictionary_words.csv"))
                print("   -> Moved pictionary_words.csv to config/")

    # 5. Clean up public assets
    if public_games_assets.exists():
        # Check if empty before deleting
        if not any(public_games_assets.iterdir()):
            public_games_assets.rmdir()
            print("✅ Deleted empty 'public/assets/games/' directory")
        else:
            print("⚠️ 'public/assets/games/' is not empty. Left intact.")

    # 6. Generate vite.config.js
    vite_config_path = root_dir / "vite.config.js"
    vite_content = """import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        blackstories: resolve(__dirname, 'games/blackstories/index.html'),
        demo: resolve(__dirname, 'games/demo-game/index.html'),
        easyfrog: resolve(__dirname, 'games/easyfrog/index.html'),
        esquisse: resolve(__dirname, 'games/esquisse/index.html'),
        olemains: resolve(__dirname, 'games/olemains/index.html'),
        pictionary: resolve(__dirname, 'games/pictionary/index.html')
      }
    }
  }
});
"""
    vite_config_path.write_text(vite_content)
    print("✅ Created vite.config.js for MPA routing")

    print("\n🚀 Structural refactor complete. OPEN CURSOR NOW to fix imports.")

if __name__ == "__main__":
    main()