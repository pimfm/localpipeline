use crate::model::agent::AgentName;

/// Each agent gets a single persistent branch that gets force-reset to origin/main
/// before each dispatch. No item-specific branches — agents always push to main.
pub fn branch_name(agent: AgentName) -> String {
    format!("agent/{}", agent.as_str())
}

pub fn worktree_path(repo_root: &str, agent: AgentName) -> String {
    let mut parts: Vec<&str> = repo_root.rsplitn(2, '/').collect();
    parts.reverse();
    if parts.len() == 2 {
        format!("{}/agent-{}", parts[0], agent.as_str())
    } else {
        format!("{}/agent-{}", repo_root, agent.as_str())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_branch_name() {
        let name = branch_name(AgentName::Ember);
        assert_eq!(name, "agent/ember");
    }

    #[test]
    fn test_worktree_path() {
        let path = worktree_path("/Users/pim/fm/workflow/main", AgentName::Ember);
        assert_eq!(path, "/Users/pim/fm/workflow/agent-ember");
    }
}
