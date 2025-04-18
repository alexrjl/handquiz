// Quiz Application state
const quizState = {
  hands: {},              // Will hold the hand data from JSON
  index: {},              // Will hold the index data from JSON
  patterns: {},           // Will hold the pattern data from JSON
  isDataLoaded: false,    // Flag to track if data is loaded
  currentHand: null,      // Will hold the current quiz hand
  currentSuitedness: [],  // Will hold the current suitedness patterns
  correctActions: {},     // Will hold the correct actions for current hand
  modifiedActions: {},    // Will hold the modified actions (some correct, some incorrect)
  userSelections: new Set(), // Will track which actions the user has selected as incorrect
  score: {                // Will track user score
    correct: 0,
    incorrect: 0,
    total: 0
  }
};

// DOM elements
const quizContainer = document.getElementById('quiz-container');
const scoreDisplay = document.getElementById('score-display');
let handDisplay;
let checkButton;
let nextButton;
let resultDisplay;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  // Apply dark mode by default to match the original app
  document.body.classList.add('dark-mode');
  
  // Create theme toggle button
  createThemeToggle();
  
  // Initialize DOM elements
  initializeDOM();
  
  // Load the compressed JSON data (same as in original app)
  fetch('comprangedictFixed.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      // Store the data in quiz state
      quizState.hands = data.hands;
      quizState.index = data.index;
      quizState.patterns = data.patterns;
      quizState.isDataLoaded = true;
      
      // Setup event listeners
      setupEventListeners();
      
      // Enable the start button
      document.getElementById('start-button').disabled = false;
    })
    .catch(error => {
      console.error('Error loading data:', error);
      quizContainer.innerHTML = `
        <div class="error-message">
          <p>Error loading data. Please check if the comprangedictFixed.json file exists and is correctly formatted.</p>
          <p>Technical details: ${error.message}</p>
        </div>
      `;
    });
});

// Create theme toggle button - reused from original app
function createThemeToggle() {
  const toggleButton = document.createElement('button');
  toggleButton.className = 'theme-toggle';
  toggleButton.innerHTML = '🌓';
  toggleButton.setAttribute('aria-label', 'Toggle dark mode');
  toggleButton.setAttribute('title', 'Toggle dark mode');
  
  toggleButton.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
  });
  
  document.body.appendChild(toggleButton);
}

// Initialize DOM elements
function initializeDOM() {
  // Create score display if it doesn't exist
  if (!scoreDisplay) {
    const scoreDiv = document.createElement('div');
    scoreDiv.id = 'score-display';
    scoreDiv.className = 'score-display';
    scoreDiv.innerHTML = 'Score: 0/0';
    quizContainer.appendChild(scoreDiv);
  }
  
  // Create hand display
  handDisplay = document.createElement('div');
  handDisplay.className = 'hand-display';
  handDisplay.innerHTML = '<div class="initial-message">Press "Start Quiz" to begin</div>';
  
  // Create button container
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'button-container';
  
  // Create check button (initially disabled)
  checkButton = document.createElement('button');
  checkButton.id = 'check-button';
  checkButton.textContent = 'Check Answers';
  checkButton.disabled = true;
  
  // Create next button (initially disabled)
  nextButton = document.createElement('button');
  nextButton.id = 'next-button';
  nextButton.textContent = 'Next Hand';
  nextButton.disabled = true;
  
  // Create result display
  resultDisplay = document.createElement('div');
  resultDisplay.className = 'result-display';
  resultDisplay.style.display = 'none';
  
  // Add buttons to button container
  buttonContainer.appendChild(checkButton);
  buttonContainer.appendChild(nextButton);
  
  // Add elements to quiz container
  quizContainer.appendChild(handDisplay);
  quizContainer.appendChild(buttonContainer);
  quizContainer.appendChild(resultDisplay);
}

// Setup event listeners
function setupEventListeners() {
  // Start button
  document.getElementById('start-button').addEventListener('click', startQuiz);
  
  // Check button
  checkButton.addEventListener('click', checkAnswers);
  
  // Next button
  nextButton.addEventListener('click', nextHand);
}

// Start the quiz
function startQuiz() {
  // Reset quiz state
  resetQuizState();
  
  // Show first hand
  nextHand();
  
  // Disable start button and enable check button
  document.getElementById('start-button').disabled = true;
  checkButton.disabled = false;
}

// Reset quiz state
function resetQuizState() {
  quizState.currentHand = null;
  quizState.currentSuitedness = [];
  quizState.correctActions = {};
  quizState.modifiedActions = {};
  quizState.userSelections = new Set();
  quizState.score = {
    correct: 0,
    incorrect: 0,
    total: 0
  };
  
  // Update score display
  updateScoreDisplay();
}

// Update score display
function updateScoreDisplay() {
  if (scoreDisplay) {
    scoreDisplay.innerHTML = `Score: ${quizState.score.correct}/${quizState.score.total}`;
  }
}

// Get random hand from data
function getRandomHand() {
  // Get all hands
  const allHands = Object.keys(quizState.hands);
  
  // Choose a random hand
  const randomIndex = Math.floor(Math.random() * allHands.length);
  const randomHand = allHands[randomIndex];
  
  return randomHand;
}

// Get random hand with patterns
function getRandomHandWithPatterns() {
  // Keep trying until we find a hand with patterns
  let hand, patterns;
  
  do {
    hand = getRandomHand();
    patterns = quizState.hands[hand];
  } while (!patterns || Object.keys(patterns).length === 0);
  
  return { hand, patterns };
}

// Display the current hand
function displayCurrentHand() {
  if (!quizState.currentHand) return;
  
  const { hand, patterns } = quizState.currentHand;
  
  // Create hand container
  const handContainer = document.createElement('div');
  handContainer.className = 'hand-group';
  
  // Create header
  const header = document.createElement('h3');
  header.textContent = hand;
  handContainer.appendChild(header);
  
  // Define the order of patterns (same as original app)
  const patternOrder = {
    '4': 1, // double (first)
    '5': 2, // single_high (second)
    '6': 3, // single_low (third)
    '2': 4, // trip_high (fourth) 
    '3': 5, // trip_low (fifth)
    '1': 6, // mono (sixth)
    '7': 7  // rainbow (last)
  };
  
  // Convert to array and sort by custom order
  const sortedPatterns = Object.entries(patterns)
    .sort((a, b) => {
      const orderA = patternOrder[a[0]] || 999;
      const orderB = patternOrder[b[0]] || 999;
      return orderA - orderB;
    });
  
  // Clear suitedness array
  quizState.currentSuitedness = [];
  
  // Create elements for each suitedness pattern
  sortedPatterns.forEach(([patternId, actions]) => {
    // Store current suitedness
    quizState.currentSuitedness.push({ patternId, actions });
    
    // Store correct actions for this pattern
    quizState.correctActions[patternId] = { ...actions };
    
    // Create modified actions (with some incorrect ones)
    quizState.modifiedActions[patternId] = createModifiedActions(actions);
    
    // Create pattern element
    const patternElement = document.createElement('div');
    patternElement.className = 'hand-pattern';
    patternElement.dataset.patternId = patternId;
    
    // Add the visualization
    patternElement.innerHTML = renderHandVisualization(hand, patternId);
    
    // Add the actions with modified (some incorrect) values and selectable UI
    patternElement.innerHTML += renderQuizActions(patternId, quizState.modifiedActions[patternId]);
    
    handContainer.appendChild(patternElement);
  });
  
  // Clear and update hand display
  handDisplay.innerHTML = '';
  handDisplay.appendChild(handContainer);
  
  // Setup click handlers for action elements
  setupActionClickHandlers();
}

// Create modified actions with some incorrect ones
function createModifiedActions(originalActions) {
  // Clone the original actions
  const modifiedActions = { ...originalActions };
  
  // Define possible actions and their ranges
  const possibleActions = {
    "SB open": [0, 100],
    "SB 4bet": [0, 100],
    "SB Cv3bet": [0, 100],
    "BB 3bet": [0, 100],
    "BB call": [0, 100],
    "BB 5bet": [0, 100],
    "BB Cv4bet": [0, 100],
    "BB Fv4bet": [0, 100]
  };
  
  // Randomly select 1-3 actions to modify
  const numToModify = Math.floor(Math.random() * 3) + 1;
  const actionKeys = Object.keys(originalActions);
  
  // If we have fewer than numToModify actions, modify all
  const actualNumToModify = Math.min(numToModify, actionKeys.length);
  
  // Randomly select actions to modify
  const actionsToModify = [];
  while (actionsToModify.length < actualNumToModify && actionKeys.length > 0) {
    const randomIndex = Math.floor(Math.random() * actionKeys.length);
    const action = actionKeys[randomIndex];
    
    if (!actionsToModify.includes(action)) {
      actionsToModify.push(action);
    }
  }
  
  // Modify selected actions
  actionsToModify.forEach(action => {
    // Get original value
    const originalValue = originalActions[action];
    
    // Get possible range
    const [min, max] = possibleActions[action] || [0, 100];
    
    // Generate a new value that's different from the original
    let newValue;
    do {
      // For values close to 0 or 100, make more significant changes
      if (originalValue < 5) {
        newValue = Math.floor(Math.random() * 50) + 20; // 20-70
      } else if (originalValue > 95) {
        newValue = Math.floor(Math.random() * 50) + 10; // 10-60
      } else {
        // For other values, more moderate changes
        const change = Math.floor(Math.random() * 60) - 30; // -30 to +30
        newValue = Math.max(min, Math.min(max, originalValue + change));
      }
    } while (Math.abs(newValue - originalValue) < 15); // Ensure significant difference
    
    // Update modified action
    modifiedActions[action] = newValue;
  });
  
  return modifiedActions;
}

// Render quiz actions with selectable UI
function renderQuizActions(patternId, actions) {
  // Safely handle potentially missing actions
  if (!actions) {
    return `<div class="actions"><div class="no-actions">No action data available</div></div>`;
  }
  
  // Process SB open action (first action)
  const sbOpenPct = actions["SB open"] || 0;
  let sbOpen = "Fold";
  if (sbOpenPct > 0) {
    sbOpen = "Raise";
    // Show percentage only if it's less than 99%
    if (sbOpenPct < 99 && sbOpenPct > 0) {
      sbOpen = `Raise[${Math.round(sbOpenPct)}%]`;
    }
  }
  
  // Process SB response to 3bet (second action)
  let sbResponse = "Fold";
  const sb4betPct = actions["SB 4bet"] || 0;
  const sbCallPct = actions["SB Cv3bet"] || 0;
  const sbFoldVs3betPct = 100 - sb4betPct - sbCallPct;
  
  // Add actions that exceed 5% threshold
  const sbResponseActions = [];
  if (sb4betPct >= 5) {
    // Skip percentage if it's ≥99%
    if (sb4betPct >= 99) sbResponseActions.push("4bet");
    else sbResponseActions.push(`4bet[${Math.round(sb4betPct)}%]`);
  }
  if (sbCallPct >= 5) {
    // Skip percentage if it's ≥99%
    if (sbCallPct >= 99) sbResponseActions.push("call");
    else sbResponseActions.push(`call[${Math.round(sbCallPct)}%]`);
  }
  if (sbFoldVs3betPct >= 5) {
    // Skip percentage if it's ≥99%
    if (sbFoldVs3betPct >= 99) sbResponseActions.push("fold");
    else sbResponseActions.push(`fold[${Math.round(sbFoldVs3betPct)}%]`);
  }
  
  // If we have mixed second actions, join them with slashes
  if (sbResponseActions.length > 1) {
    sbResponse = sbResponseActions.join('/');
  } 
  // If only one action exceeds 5%, use that
  else if (sbResponseActions.length === 1) {
    sbResponse = sbResponseActions[0];
  }
  
  // Process BB first action vs open
  let bbAction = "Fold";
  const bb3betPct = actions["BB 3bet"] || 0;
  const bbCallPct = actions["BB call"] || 0;
  const bbFoldPct = 100 - bb3betPct - bbCallPct;
  
  // For BB first action, show the majority action with percentage if mixed
  if (bb3betPct > bbCallPct && bb3betPct > bbFoldPct) {
    bbAction = bb3betPct < 99 ? `3bet[${Math.round(bb3betPct)}%]` : "3bet";
  } else if (bbCallPct > bb3betPct && bbCallPct > bbFoldPct) {
    bbAction = bbCallPct < 99 ? `call[${Math.round(bbCallPct)}%]` : "call";
  } else if (bbFoldPct > bb3betPct && bbFoldPct > bbCallPct) {
    bbAction = bbFoldPct < 99 ? `fold[${Math.round(bbFoldPct)}%]` : "fold";
  } 
  // Handle exact ties by showing both
  else if (bb3betPct === bbCallPct && bb3betPct > bbFoldPct) {
    bbAction = `3bet[${Math.round(bb3betPct)}%]/call[${Math.round(bbCallPct)}%]`;
  } else if (bb3betPct === bbFoldPct && bb3betPct > bbCallPct) {
    bbAction = `3bet[${Math.round(bb3betPct)}%]/fold[${Math.round(bbFoldPct)}%]`;
  } else if (bbCallPct === bbFoldPct && bbCallPct > bb3betPct) {
    bbAction = `call[${Math.round(bbCallPct)}%]/fold[${Math.round(bbFoldPct)}%]`;
  }
  // Perfect three-way tie (very unlikely)
  else if (bb3betPct === bbCallPct && bb3betPct === bbFoldPct) {
    bbAction = `3bet[${Math.round(bb3betPct)}%]/call[${Math.round(bbCallPct)}%]/fold[${Math.round(bbFoldPct)}%]`;
  }
  
  // Process BB response to 4bet (second action)
  let bbResponse = "Fold";
  const bb5betPct = actions["BB 5bet"] || 0;
  const bbCv4betPct = actions["BB Cv4bet"] || 0;
  const bbFv4betPct = actions["BB Fv4bet"] || 0;
  
  // Add actions that exceed 5% threshold
  const bbResponseActions = [];
  if (bb5betPct >= 5) {
    // Skip percentage if it's ≥99%
    if (bb5betPct >= 99) bbResponseActions.push("5bet");
    else bbResponseActions.push(`5bet[${Math.round(bb5betPct)}%]`);
  }
  if (bbCv4betPct >= 5) {
    // Skip percentage if it's ≥99%
    if (bbCv4betPct >= 99) bbResponseActions.push("call");
    else bbResponseActions.push(`call[${Math.round(bbCv4betPct)}%]`);
  }
  if (bbFv4betPct >= 5) {
    // Skip percentage if it's ≥99%
    if (bbFv4betPct >= 99) bbResponseActions.push("fold");
    else bbResponseActions.push(`fold[${Math.round(bbFv4betPct)}%]`);
  }
  
  // If we have mixed second actions, join them with slashes
  if (bbResponseActions.length > 1) {
    bbResponse = bbResponseActions.join('/');
  } 
  // If only one action exceeds 5%, use that
  else if (bbResponseActions.length === 1) {
    bbResponse = bbResponseActions[0];
  }
  
  // Return the formatted actions with selectable UI
  return `
    <div class="actions actions-quiz">
      <div class="action-row" data-pattern-id="${patternId}">
        <div class="action-label">SB: </div>
        <div class="action-item sb-open" data-action-type="sb-open">${sbOpen}</div>
        <div class="action-separator">|</div>
        <div class="action-item sb-response" data-action-type="sb-response">${sbResponse}</div>
      </div>
      <div class="action-row" data-pattern-id="${patternId}">
        <div class="action-label">BB: </div>
        <div class="action-item bb-action" data-action-type="bb-action">${bbAction}</div>
        <div class="action-separator">|</div>
        <div class="action-item bb-response" data-action-type="bb-response">${bbResponse}</div>
      </div>
    </div>
  `;
}

// Setup click handlers for action elements
function setupActionClickHandlers() {
  const actionItems = document.querySelectorAll('.action-item');
  
  actionItems.forEach(item => {
    item.addEventListener('click', () => {
      // Toggle selected class
      item.classList.toggle('selected');
      
      // Get pattern ID and action type
      const patternId = item.closest('.action-row').dataset.patternId;
      const actionType = item.dataset.actionType;
      
      // Create a unique identifier for this action
      const actionId = `${patternId}-${actionType}`;
      
      // Toggle selection in state
      if (item.classList.contains('selected')) {
        quizState.userSelections.add(actionId);
      } else {
        quizState.userSelections.delete(actionId);
      }
    });
  });
}

// Check answers
function checkAnswers() {
  if (!quizState.currentHand) return;
  
  // Disable check button and enable next button
  checkButton.disabled = true;
  nextButton.disabled = false;
  
  // Identify correct and incorrect actions
  const correctSelections = new Set();
  const incorrectSelections = new Set();
  const missedSelections = new Set();
  
  // Map from action type to action keys
  const actionTypeMap = {
    'sb-open': ['SB open'],
    'sb-response': ['SB 4bet', 'SB Cv3bet'],
    'bb-action': ['BB 3bet', 'BB call'],
    'bb-response': ['BB 5bet', 'BB Cv4bet', 'BB Fv4bet']
  };
  
  // Check each pattern
  quizState.currentSuitedness.forEach(({ patternId }) => {
    // Get the correct and modified actions for this pattern
    const correctAction = quizState.correctActions[patternId];
    const modifiedAction = quizState.modifiedActions[patternId];
    
    // Check each action type
    for (const [actionType, actionKeys] of Object.entries(actionTypeMap)) {
      // Check if any of the associated action keys were modified
      const wasModified = actionKeys.some(key => 
        correctAction[key] !== undefined && 
        modifiedAction[key] !== undefined && 
        correctAction[key] !== modifiedAction[key]
      );
      
      // Create action ID
      const actionId = `${patternId}-${actionType}`;
      
      if (wasModified) {
        // This action was modified, should have been selected
        if (quizState.userSelections.has(actionId)) {
          correctSelections.add(actionId);
        } else {
          missedSelections.add(actionId);
        }
      } else {
        // This action was not modified, should not have been selected
        if (quizState.userSelections.has(actionId)) {
          incorrectSelections.add(actionId);
        }
      }
    }
  });
  
  // Update scores
  quizState.score.correct += correctSelections.size;
  quizState.score.incorrect += incorrectSelections.size + missedSelections.size;
  quizState.score.total += correctSelections.size + incorrectSelections.size + missedSelections.size;
  
  // Update score display
  updateScoreDisplay();
  
  // Show correct and incorrect selections
  highlightAnswers(correctSelections, incorrectSelections, missedSelections);
  
  // Show correct actions
  showCorrectActions();
}

// Highlight correct and incorrect answers
function highlightAnswers(correctSelections, incorrectSelections, missedSelections) {
  // Clear previous highlights
  document.querySelectorAll('.action-item').forEach(item => {
    item.classList.remove('correct', 'incorrect', 'missed');
  });
  
  // Highlight correct selections
  correctSelections.forEach(actionId => {
    const [patternId, actionType] = actionId.split('-');
    const actionItem = document.querySelector(`.action-row[data-pattern-id="${patternId}"] .action-item[data-action-type="${actionType}"]`);
    if (actionItem) {
      actionItem.classList.add('correct');
    }
  });
  
  // Highlight incorrect selections
  incorrectSelections.forEach(actionId => {
    const [patternId, actionType] = actionId.split('-');
    const actionItem = document.querySelector(`.action-row[data-pattern-id="${patternId}"] .action-item[data-action-type="${actionType}"]`);
    if (actionItem) {
      actionItem.classList.add('incorrect');
    }
  });
  
  // Highlight missed selections
  missedSelections.forEach(actionId => {
    const [patternId, actionType] = actionId.split('-');
    const actionItem = document.querySelector(`.action-row[data-pattern-id="${patternId}"] .action-item[data-action-type="${actionType}"]`);
    if (actionItem) {
      actionItem.classList.add('missed');
    }
  });
}

// Show correct actions
function showCorrectActions() {
  // Clear previous results
  resultDisplay.innerHTML = '';
  resultDisplay.style.display = 'block';
  
  const resultsHeader = document.createElement('h3');
  resultsHeader.textContent = 'Correct Actions:';
  resultDisplay.appendChild(resultsHeader);
  
  // For each pattern, show the correct actions
  quizState.currentSuitedness.forEach(({ patternId }) => {
    const patternElement = document.createElement('div');
    patternElement.className = 'correct-actions';
    
    // Get pattern name for display
    const patternTypes = {
      '1': 'Mono',
      '2': 'Trip High',
      '3': 'Trip Low',
      '4': 'Double',
      '5': 'Single High',
      '6': 'Single Low',
      '7': 'Rainbow'
    };
    
    patternElement.innerHTML = `
      <div class="pattern-name">${patternTypes[patternId] || 'Unknown'}</div>
      ${renderActions(quizState.correctActions[patternId])}
    `;
    
    resultDisplay.appendChild(patternElement);
  });
}

// Next hand
function nextHand() {
  // Clear user selections
  quizState.userSelections = new Set();
  
  // Clear result display
  resultDisplay.innerHTML = '';
  resultDisplay.style.display = 'none';
  
  // Get random hand with patterns
  quizState.currentHand = getRandomHandWithPatterns();
  
  // Display current hand
  displayCurrentHand();
  
  // Enable check button and disable next button
  checkButton.disabled = false;
  nextButton.disabled = true;
}

// Render actions (from original app)
function renderActions(actions) {
  // Safely handle potentially missing actions
  if (!actions) {
    return `<div class="actions"><div class="no-actions">No action data available</div></div>`;
  }
  
  // Process SB open action (first action)
  const sbOpenPct = actions["SB open"] || 0;
  let sbOpen = "Fold";
  if (sbOpenPct > 0) {
    sbOpen = "Raise";
    // Show percentage only if it's less than 99%
    if (sbOpenPct < 99 && sbOpenPct > 0) {
      sbOpen = `Raise[${Math.round(sbOpenPct)}%]`;
    }
  }
  
  // Process SB response to 3bet (second action)
  let sbResponse = "Fold";
  const sb4betPct = actions["SB 4bet"] || 0;
  const sbCallPct = actions["SB Cv3bet"] || 0;
  const sbFoldVs3betPct = 100 - sb4betPct - sbCallPct;
  
  // Add actions that exceed 5% threshold
  const sbResponseActions = [];
  if (sb4betPct >= 5) {
    // Skip percentage if it's ≥99%
    if (sb4betPct >= 99) sbResponseActions.push("4bet");
    else sbResponseActions.push(`4bet[${Math.round(sb4betPct)}%]`);
  }
  if (sbCallPct >= 5) {
    // Skip percentage if it's ≥99%
    if (sbCallPct >= 99) sbResponseActions.push("call");
    else sbResponseActions.push(`call[${Math.round(sbCallPct)}%]`);
  }
  if (sbFoldVs3betPct >= 5) {
    // Skip percentage if it's ≥99%
    if (sbFoldVs3betPct >= 99) sbResponseActions.push("fold");
    else sbResponseActions.push(`fold[${Math.round(sbFoldVs3betPct)}%]`);
  }
  
  // If we have mixed second actions, join them with slashes
  if (sbResponseActions.length > 1) {
    sbResponse = sbResponseActions.join('/');
  } 
  // If only one action exceeds 5%, use that
  else if (sbResponseActions.length === 1) {
    sbResponse = sbResponseActions[0];
  }
  
  // Process BB first action vs open
  let bbAction = "Fold";
  const bb3betPct = actions["BB 3bet"] || 0;
  const bbCallPct = actions["BB call"] || 0;
  const bbFoldPct = 100 - bb3betPct - bbCallPct;
  
  // For BB first action, show the majority action with percentage if mixed
  if (bb3betPct > bbCallPct && bb3betPct > bbFoldPct) {
    bbAction = bb3betPct < 99 ? `3bet[${Math.round(bb3betPct)}%]` : "3bet";
  } else if (bbCallPct > bb3betPct && bbCallPct > bbFoldPct) {
    bbAction = bbCallPct < 99 ? `call[${Math.round(bbCallPct)}%]` : "call";
  } else if (bbFoldPct > bb3betPct && bbFoldPct > bbCallPct) {
    bbAction = bbFoldPct < 99 ? `fold[${Math.round(bbFoldPct)}%]` : "fold";
  } 
  // Handle exact ties by showing both
  else if (bb3betPct === bbCallPct && bb3betPct > bbFoldPct) {
    bbAction = `3bet[${Math.round(bb3betPct)}%]/call[${Math.round(bbCallPct)}%]`;
  } else if (bb3betPct === bbFoldPct && bb3betPct > bbCallPct) {
    bbAction = `3bet[${Math.round(bb3betPct)}%]/fold[${Math.round(bbFoldPct)}%]`;
  } else if (bbCallPct === bbFoldPct && bbCallPct > bb3betPct) {
    bbAction = `call[${Math.round(bbCallPct)}%]/fold[${Math.round(bbFoldPct)}%]`;
  }
  // Perfect three-way tie (very unlikely)
  else if (bb3betPct === bbCallPct && bb3betPct === bbFoldPct) {
    bbAction = `3bet[${Math.round(bb3betPct)}%]/call[${Math.round(bbCallPct)}%]/fold[${Math.round(bbFoldPct)}%]`;
  }
  
  // Process BB response to 4bet (second action)
  let bbResponse = "Fold";
  const bb5betPct = actions["BB 5bet"] || 0;
  const bbCv4betPct = actions["BB Cv4bet"] || 0;
  const bbFv4betPct = actions["BB Fv4bet"] || 0;
  
  // Add actions that exceed 5% threshold
  const bbResponseActions = [];
  if (bb5betPct >= 5) {
    // Skip percentage if it's ≥99%
    if (bb5betPct >= 99) bbResponseActions.push("5bet");
    else bbResponseActions.push(`5bet[${Math.round(bb5betPct)}%]`);
  }
  if (bbCv4betPct >= 5) {
    // Skip percentage if it's ≥99%
    if (bbCv4betPct >= 99) bbResponseActions.push("call");
    else bbResponseActions.push(`call[${Math.round(bbCv4betPct)}%]`);
  }
  if (bbFv4betPct >= 5) {
    // Skip percentage if it's ≥99%
    if (bbFv4betPct >= 99) bbResponseActions.push("fold");
    else bbResponseActions.push(`fold[${Math.round(bbFv4betPct)}%]`);
  }
  
  // If we have mixed second actions, join them with slashes
  if (bbResponseActions.length > 1) {
    bbResponse = bbResponseActions.join('/');
  } 
  // If only one action exceeds 5%, use that
  else if (bbResponseActions.length === 1) {
    bbResponse = bbResponseActions[0];
  }
  
  // Return the formatted actions with pipe separator
  return `
    <div class="actions actions-horizontal">
      <div class="sb-action">SB: ${sbOpen} | ${sbResponse}</div>
      <div class="bb-action">BB: ${bbAction} | ${bbResponse}</div>
    </div>
  `;
}

// Reuse renderHandVisualization, getColorsForPattern, and determineRankPattern from original app
// These functions will be imported from app.js in a real implementation
