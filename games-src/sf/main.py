"""
Street Fighter — NEOARCADE port
Original: https://github.com/AadityaPanda/Street_Fighter
Patched for Pygbag (WebAssembly):
  - Removed cv2 / opencv dependency
  - All blocking loops converted to async / await asyncio.sleep(0)
  - Fixed screen size 1280×720 (no pygame.display.Info)
  - pygame.time.delay replaced with asyncio.sleep
"""

import asyncio
import math
import os
import sys

import numpy as np
import pygame
from pygame import font, mixer

from fighter import Fighter


# ── helpers ────────────────────────────────────────────────────────────────────

def resource_path(relative_path: str) -> str:
    try:
        base_path = sys._MEIPASS  # type: ignore[attr-defined]
    except AttributeError:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)


def _pygame_blur(surface: pygame.Surface, radius: int = 8) -> pygame.Surface:
    """Poor-man's Gaussian blur via resize-down + resize-up (no cv2)."""
    w, h = surface.get_size()
    small = pygame.transform.smoothscale(surface, (max(1, w // radius), max(1, h // radius)))
    return pygame.transform.smoothscale(small, (w, h))


# ── constants ──────────────────────────────────────────────────────────────────

SCREEN_WIDTH = 1280
SCREEN_HEIGHT = 720
FPS = 60
ROUND_OVER_COOLDOWN = 3000

RED     = (255,   0,   0)
YELLOW  = (255, 255,   0)
WHITE   = (255, 255, 255)
BLACK   = (  0,   0,   0)
BLUE    = (  0,   0, 255)
GREEN   = (  0, 255,   0)

# ── pygame init ────────────────────────────────────────────────────────────────

mixer.pre_init(44100, -16, 2, 512)
pygame.init()
mixer.init()

screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption("Street Fighter — NEOARCADE")
clock = pygame.time.Clock()

# ── globals (populated in async main) ─────────────────────────────────────────

bg_surface:            pygame.Surface
bg_surface_blurred:    pygame.Surface
victory_img:           pygame.Surface
warrior_victory_img:   pygame.Surface
wizard_victory_img:    pygame.Surface
menu_font:             pygame.font.Font
menu_font_title:       pygame.font.Font
count_font:            pygame.font.Font
score_font:            pygame.font.Font
sword_fx:              pygame.mixer.Sound
magic_fx:              pygame.mixer.Sound
warrior_sheet:         pygame.Surface
wizard_sheet:          pygame.Surface
score:                 list[int]

# ── drawing helpers ────────────────────────────────────────────────────────────

def draw_text(text: str, fnt: pygame.font.Font, color: tuple, x: int, y: int) -> None:
    img = fnt.render(text, True, color)
    screen.blit(img, (x, y))


def draw_bg(blurred: bool = False) -> None:
    surf = bg_surface_blurred if blurred else bg_surface
    scaled = pygame.transform.scale(surf, (SCREEN_WIDTH, SCREEN_HEIGHT))
    screen.blit(scaled, (0, 0))


def draw_button(
    text: str,
    fnt: pygame.font.Font,
    text_col: tuple,
    button_col: tuple,
    x: int, y: int,
    width: int, height: int,
) -> pygame.Rect:
    pygame.draw.rect(screen, button_col, (x, y, width, height))
    pygame.draw.rect(screen, WHITE, (x, y, width, height), 2)
    img = fnt.render(text, True, text_col)
    rect = img.get_rect(center=(x + width // 2, y + height // 2))
    screen.blit(img, rect)
    return pygame.Rect(x, y, width, height)


def draw_gradient_text(
    text: str, fnt: pygame.font.Font, x: int, y: int, colors: list[tuple]
) -> None:
    offset = 2
    for i, color in enumerate(colors):
        img = fnt.render(text, True, color)
        screen.blit(img, (x + i * offset, y + i * offset))


def draw_health_bar(health: int, x: int, y: int) -> None:
    pygame.draw.rect(screen, BLACK,  (x, y, 200, 20))
    if health > 0:
        pygame.draw.rect(screen, RED, (x, y, health * 2, 20))
    pygame.draw.rect(screen, WHITE, (x, y, 200, 20), 2)


# ── game screens (all async) ───────────────────────────────────────────────────

async def victory_screen(winner_img: pygame.Surface) -> None:
    start_time = pygame.time.get_ticks()
    resized = pygame.transform.scale(
        victory_img,
        (victory_img.get_width() * 2, victory_img.get_height() * 2),
    )
    while pygame.time.get_ticks() - start_time < ROUND_OVER_COOLDOWN:
        draw_bg(blurred=False)
        screen.blit(resized, (
            SCREEN_WIDTH // 2 - resized.get_width() // 2,
            SCREEN_HEIGHT // 2 - resized.get_height() // 2 - 50,
        ))
        screen.blit(winner_img, (
            SCREEN_WIDTH // 2 - winner_img.get_width() // 2,
            SCREEN_HEIGHT // 2 - winner_img.get_height() // 2 + 100,
        ))
        pygame.display.update()
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                return
        await asyncio.sleep(0)


async def countdown() -> None:
    countdown_font = pygame.font.Font(resource_path("assets/fonts/turok.ttf"), 100)
    for text in ["3", "2", "1", "FIGHT!"]:
        draw_bg(blurred=False)
        img = countdown_font.render(text, True, RED)
        screen.blit(img, ((SCREEN_WIDTH - img.get_width()) // 2, SCREEN_HEIGHT // 2 - 50))
        pygame.display.update()
        await asyncio.sleep(1.0)


async def main_menu() -> str:
    """Returns one of: 'START', 'CONTROLS', 'SCORES'."""
    animation_start = pygame.time.get_ticks()
    bw, bh, bsp = 280, 60, 30
    bx = SCREEN_WIDTH // 2 - bw // 2
    start_y    = SCREEN_HEIGHT // 2 - (bh + bsp) * 2 + 50
    controls_y = SCREEN_HEIGHT // 2 - (bh + bsp) * 1 + 50
    scores_y   = SCREEN_HEIGHT // 2 + (bh + bsp) * 0 + 50
    exit_y     = SCREEN_HEIGHT // 2 + (bh + bsp) * 1 + 50

    while True:
        draw_bg(blurred=True)

        elapsed = (pygame.time.get_ticks() - animation_start) / 1000
        scale = 1 + 0.05 * math.sin(elapsed * 2 * math.pi)
        scaled_fnt = pygame.font.Font(resource_path("assets/fonts/turok.ttf"), int(100 * scale))
        title = "STREET FIGHTER"
        tx = SCREEN_WIDTH // 2 - scaled_fnt.size(title)[0] // 2
        ty = SCREEN_HEIGHT // 6
        draw_text(title, scaled_fnt, BLACK, tx + 5, ty + 5)
        draw_gradient_text(title, scaled_fnt, tx, ty, [BLUE, GREEN, YELLOW])

        btn_start    = draw_button("START GAME", menu_font, BLACK, GREEN, bx, start_y,    bw, bh)
        btn_controls = draw_button("CONTROLS",   menu_font, BLACK, GREEN, bx, controls_y, bw, bh)
        btn_scores   = draw_button("SCORES",     menu_font, BLACK, GREEN, bx, scores_y,   bw, bh)
        btn_exit     = draw_button("EXIT",       menu_font, BLACK, GREEN, bx, exit_y,     bw, bh)

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                return "EXIT"
            if event.type == pygame.MOUSEBUTTONDOWN:
                if btn_start.collidepoint(event.pos):    return "START"
                if btn_controls.collidepoint(event.pos): return "CONTROLS"
                if btn_scores.collidepoint(event.pos):   return "SCORES"
                if btn_exit.collidepoint(event.pos):
                    pygame.quit()
                    return "EXIT"

        pygame.display.update()
        clock.tick(FPS)
        await asyncio.sleep(0)


async def scores_screen() -> None:
    sf_large = pygame.font.Font(resource_path("assets/fonts/turok.ttf"), 60)
    while True:
        draw_bg(blurred=False)
        draw_text("SCORES", menu_font_title, RED,
                  SCREEN_WIDTH // 2 - menu_font_title.size("SCORES")[0] // 2, 50)
        for i, (label, color) in enumerate([
            (f"P1: {score[0]}", (BLUE, GREEN)),
            (f"P2: {score[1]}", (RED,  YELLOW)),
        ]):
            lx = SCREEN_WIDTH // 2 - sf_large.size(label)[0] // 2
            ly = SCREEN_HEIGHT // 2 - 50 + i * 100
            draw_text(label, sf_large, BLACK, lx + 5, ly + 5)
            draw_gradient_text(label, sf_large, lx, ly, list(color))

        btn = draw_button("RETURN TO MAIN MENU", menu_font, BLACK, GREEN,
                          SCREEN_WIDTH // 2 - 220, 700, 500, 50)
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                return
            if event.type == pygame.MOUSEBUTTONDOWN:
                if btn.collidepoint(event.pos):
                    return

        pygame.display.update()
        clock.tick(FPS)
        await asyncio.sleep(0)


async def controls_screen() -> None:
    cf   = pygame.font.Font(resource_path("assets/fonts/turok.ttf"), 35)
    smf  = pygame.font.Font(resource_path("assets/fonts/turok.ttf"), 25)
    while True:
        draw_bg(blurred=False)
        draw_text("CONTROLS GUIDE", menu_font_title, GREEN,
                  SCREEN_WIDTH // 2 - menu_font_title.size("CONTROLS GUIDE")[0] // 2, 50)
        # Movement
        draw_text("MOVEMENT:",      cf,  WHITE,  100, 150)
        draw_text("A  – Move Left", smf, BLUE,   100, 190)
        draw_text("D  – Move Right",smf, BLUE,   100, 220)
        draw_text("W  – Jump",      smf, BLUE,   100, 250)
        # Attack
        draw_text("ATTACKS:",             cf,  WHITE,  100, 300)
        draw_text("R – Close Range Attack", smf, RED,  100, 340)
        draw_text("T – Long Range Attack",  smf, RED,  100, 370)
        # Info
        draw_text("GAME INFO:", cf, WHITE, 500, 150)
        draw_text("• You = WARRIOR (left)",     smf, YELLOW,      500, 190)
        draw_text("• CPU = WIZARD (right)",      smf, (255,100,0), 500, 220)
        draw_text("• Each attack: 10 damage",    smf, WHITE,       500, 250)
        draw_text("• First to 0 HP loses",       smf, WHITE,       500, 280)
        # NEOARCADE joystick
        draw_text("NEOARCADE JOYSTICK:", cf, (0,200,255), 500, 330)
        draw_text("← → ↑  = move/jump",    smf, (150,220,255), 500, 370)
        draw_text("A = Close  B = Long",    smf, (150,220,255), 500, 400)

        btn = draw_button("RETURN TO MAIN MENU", menu_font, BLACK, GREEN,
                          SCREEN_WIDTH // 2 - 220, 580, 500, 50)
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                return
            if event.type == pygame.MOUSEBUTTONDOWN:
                if btn.collidepoint(event.pos):
                    return

        pygame.display.update()
        clock.tick(FPS)
        await asyncio.sleep(0)


def reset_game() -> tuple["Fighter", "Fighter"]:
    WARRIOR_ANIMATION_STEPS = [10, 8, 1, 7, 7, 3, 7]
    WIZARD_ANIMATION_STEPS  = [8, 8, 1, 8, 8, 3, 7]

    WARRIOR_SIZE   = 162; WARRIOR_SCALE  = 4; WARRIOR_OFFSET = [72, 46]
    WIZARD_SIZE    = 250; WIZARD_SCALE   = 3; WIZARD_OFFSET  = [112, 97]

    f1 = Fighter(
        1, 200, 310, False,
        [WARRIOR_SIZE, WARRIOR_SCALE, WARRIOR_OFFSET],
        warrior_sheet, WARRIOR_ANIMATION_STEPS, sword_fx,
    )
    f2 = Fighter(
        2, 700, 310, True,
        [WIZARD_SIZE, WIZARD_SCALE, WIZARD_OFFSET],
        wizard_sheet, WIZARD_ANIMATION_STEPS, magic_fx,
    )
    return f1, f2


async def game_loop() -> None:
    fighter_1, fighter_2 = reset_game()
    round_over  = False
    winner_img: pygame.Surface | None = None

    await countdown()

    while True:
        draw_bg(blurred=False)

        draw_text(f"P1: {score[0]}", score_font, RED, 20, 20)
        draw_text(f"P2: {score[1]}", score_font, RED, SCREEN_WIDTH - 220, 20)

        plabel_fnt = pygame.font.Font(resource_path("assets/fonts/turok.ttf"), 25)
        draw_text("USER",     plabel_fnt, BLUE,       20,               85)
        draw_text("COMPUTER", plabel_fnt, (255,100,0), SCREEN_WIDTH-220, 85)

        draw_health_bar(fighter_1.health, 20, 50)
        draw_health_bar(fighter_2.health, SCREEN_WIDTH - 220, 50)

        exit_btn = draw_button("MAIN MENU", menu_font, BLACK, YELLOW,
                               SCREEN_WIDTH // 2 - 150, 20, 300, 50)

        if not round_over:
            fighter_1.move(SCREEN_WIDTH, SCREEN_HEIGHT, fighter_2, round_over)
            fighter_2.move(SCREEN_WIDTH, SCREEN_HEIGHT, fighter_1, round_over)
            fighter_1.update()
            fighter_2.update()

            if not fighter_1.alive:
                score[1] += 1
                round_over = True
                warrior_victory_img  # access global
                winner_img = wizard_victory_img
            elif not fighter_2.alive:
                score[0] += 1
                round_over = True
                winner_img = warrior_victory_img
        else:
            if winner_img is not None:
                await victory_screen(winner_img)
            return

        fighter_1.draw(screen)
        fighter_2.draw(screen)

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                return
            if event.type == pygame.MOUSEBUTTONDOWN:
                if exit_btn.collidepoint(event.pos):
                    return

        pygame.display.update()
        clock.tick(FPS)
        await asyncio.sleep(0)


# ── entry point ────────────────────────────────────────────────────────────────

async def main() -> None:
    global bg_surface, bg_surface_blurred
    global victory_img, warrior_victory_img, wizard_victory_img
    global menu_font, menu_font_title, count_font, score_font
    global sword_fx, magic_fx
    global warrior_sheet, wizard_sheet
    global score

    await asyncio.sleep(0)  # yield to browser before loading

    # ── load assets ────────────────────────────────────────────────────────────
    bg_surface = pygame.image.load(resource_path("assets/images/bg1.jpg")).convert()
    bg_surface_blurred = _pygame_blur(bg_surface, radius=8)

    victory_img         = pygame.image.load(resource_path("assets/images/victory.png")).convert_alpha()
    warrior_victory_img = pygame.image.load(resource_path("assets/images/warrior.png")).convert_alpha()
    wizard_victory_img  = pygame.image.load(resource_path("assets/images/wizard.png")).convert_alpha()

    menu_font       = pygame.font.Font(resource_path("assets/fonts/turok.ttf"), 50)
    menu_font_title = pygame.font.Font(resource_path("assets/fonts/turok.ttf"), 100)
    count_font      = pygame.font.Font(resource_path("assets/fonts/turok.ttf"), 80)
    score_font      = pygame.font.Font(resource_path("assets/fonts/turok.ttf"), 30)

    try:
        pygame.mixer.music.load(resource_path("assets/audio/music.mp3"))
        pygame.mixer.music.set_volume(0.5)
        pygame.mixer.music.play(-1, 0.0, 5000)
    except Exception:
        pass  # audio might be unavailable in some browser contexts

    try:
        sword_fx = pygame.mixer.Sound(resource_path("assets/audio/sword.wav"))
        sword_fx.set_volume(0.5)
        magic_fx = pygame.mixer.Sound(resource_path("assets/audio/magic.wav"))
        magic_fx.set_volume(0.75)
    except Exception:
        sword_fx = magic_fx = None  # type: ignore[assignment]

    warrior_sheet = pygame.image.load(resource_path("assets/images/warrior.png")).convert_alpha()
    wizard_sheet  = pygame.image.load(resource_path("assets/images/wizard.png")).convert_alpha()

    score = [0, 0]

    await asyncio.sleep(0)  # yield after loading

    # ── game loop ──────────────────────────────────────────────────────────────
    while True:
        selection = await main_menu()
        if selection == "START":
            await game_loop()
        elif selection == "CONTROLS":
            await controls_screen()
        elif selection == "SCORES":
            await scores_screen()
        elif selection == "EXIT":
            return


asyncio.run(main())
