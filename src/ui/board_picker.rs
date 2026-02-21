use ratatui::{
    layout::{Alignment, Constraint, Direction, Layout, Rect},
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, List, ListItem, Paragraph},
    Frame,
};

use crate::app::App;
use crate::ui::theme;

pub fn render(f: &mut Frame, area: Rect, app: &App) {
    // Center the picker: 60 wide, 80% tall
    let width = 60u16.min(area.width.saturating_sub(4));
    let height = area.height.saturating_sub(4);
    let x = area.x + (area.width.saturating_sub(width)) / 2;
    let y = area.y + (area.height.saturating_sub(height)) / 2;
    let centered = Rect::new(x, y, width, height);

    let vertical = Layout::default()
        .direction(Direction::Vertical)
        .constraints([Constraint::Length(3), Constraint::Min(3)])
        .split(centered);

    // Header with project path
    let dir_display = if app.project_dir.len() > (width as usize - 4) {
        format!("...{}", &app.project_dir[app.project_dir.len() - (width as usize - 7)..])
    } else {
        app.project_dir.clone()
    };
    let header = Paragraph::new(vec![
        Line::from(Span::styled(
            "Select a board for this project",
            Style::default().fg(Color::White).add_modifier(Modifier::BOLD),
        )),
        Line::from(Span::styled(
            dir_display,
            Style::default().fg(Color::DarkGray),
        )),
    ])
    .alignment(Alignment::Center);
    f.render_widget(header, vertical[0]);

    if app.loading {
        let loading = Paragraph::new("Loading boards...")
            .style(Style::default().fg(Color::Yellow))
            .alignment(Alignment::Center)
            .block(Block::default().borders(Borders::ALL).title("Boards"));
        f.render_widget(loading, vertical[1]);
        return;
    }

    if app.available_boards.is_empty() {
        let empty = Paragraph::new("No boards found")
            .style(Style::default().fg(Color::DarkGray))
            .alignment(Alignment::Center)
            .block(Block::default().borders(Borders::ALL).title("Boards"));
        f.render_widget(empty, vertical[1]);
        return;
    }

    let items: Vec<ListItem> = app
        .available_boards
        .iter()
        .enumerate()
        .map(|(i, board)| {
            let source_color = theme::source_color(&board.source);
            let selected = i == app.selected_board;
            let marker = if selected { "> " } else { "  " };
            let style = if selected {
                Style::default()
                    .fg(Color::White)
                    .add_modifier(Modifier::BOLD)
            } else {
                Style::default().fg(Color::Gray)
            };

            ListItem::new(Line::from(vec![
                Span::styled(marker, style),
                Span::styled(&board.name, style),
                Span::raw("  "),
                Span::styled(&board.source, Style::default().fg(source_color)),
            ]))
        })
        .collect();

    let list = List::new(items).block(
        Block::default()
            .borders(Borders::ALL)
            .title("Boards")
            .title_alignment(Alignment::Left),
    );
    f.render_widget(list, vertical[1]);
}
