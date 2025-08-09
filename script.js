console.log('Script.js is loading...');

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - script.js is running');
    let choices = [];
    let selectedOptionA = '';
    let selectedOptionB = '';
    
    // Navigation history for undo/redo functionality
    let navigationHistory = [];
    let currentHistoryIndex = -1;

    // DOM Elements
    const choicesContainer = document.getElementById('choices-container');
    const addChoiceBtn = document.getElementById('add-choice');
    const proceedToComparisonBtn = document.getElementById('proceed-to-comparison');
    const optionASelect = document.getElementById('option-a');
    const optionBSelect = document.getElementById('option-b');
    const startComparisonBtn = document.getElementById('start-comparison');
    const proceedToScoringBtn = document.getElementById('proceed-to-scoring');
    const calculateResultBtn = document.getElementById('calculate-result');
    const startOverBtn = document.getElementById('start-over');
    const universalStartOverBtn = document.getElementById('universal-start-over');
    const shareResultsBtn = document.getElementById('share-results');
    const savePdfBtn = document.getElementById('save-pdf');
    const navBackBtn = document.getElementById('nav-back-btn');
    const navForwardBtn = document.getElementById('nav-forward-btn');

    // Sections
    const brainstormSection = document.getElementById('brainstorm-section');
    const selectionSection = document.getElementById('selection-section');
    const comparisonSection = document.getElementById('comparison-section');
    const scoringSection = document.getElementById('scoring-section');
    const resultsSection = document.getElementById('results-section');

    // Initialize the app
    console.log('About to initialize app...');
    init();
    
    // Load saved data if available
    loadSavedData();
    
    // Check for dev mode hash navigation
    console.log('About to check dev mode hash...');
    checkDevModeHash();
    
    // Listen for hash changes
    console.log('Adding hashchange listener...');
    window.addEventListener('hashchange', checkDevModeHash);

    function init() {
        updateChoices();
        setupEventListeners();
        updateMetaTags();
        
        // Create initial history entry for brainstorm section
        initializeNavigationHistory();
        updateNavigationButtons();
    }

    function updateMetaTags() {
        // Set the current URL for Open Graph
        const ogUrl = document.querySelector('meta[property="og:url"]');
        if (ogUrl) {
            ogUrl.setAttribute('content', window.location.href);
        }
        
        // You can set this to your actual image URL when you have one
        // For now, we'll leave it empty and platforms will use a default
        const ogImage = document.querySelector('meta[property="og:image"]');
        const twitterImage = document.querySelector('meta[name="twitter:image"]');
        
        // If you host the preview image somewhere, update these:
        // if (ogImage) ogImage.setAttribute('content', 'https://your-domain.com/preview-card.png');
        // if (twitterImage) twitterImage.setAttribute('content', 'https://your-domain.com/preview-card.png');
    }

    function setupEventListeners() {
        addChoiceBtn.addEventListener('click', addChoice);
        proceedToComparisonBtn.addEventListener('click', proceedToComparison);
        startComparisonBtn.addEventListener('click', startComparison);
        proceedToScoringBtn.addEventListener('click', proceedToScoring);
        calculateResultBtn.addEventListener('click', calculateResult);
        startOverBtn.addEventListener('click', startOver);
        universalStartOverBtn.addEventListener('click', universalStartOver);
        shareResultsBtn.addEventListener('click', shareResults);
        savePdfBtn.addEventListener('click', savePDF);
        navBackBtn.addEventListener('click', goBack);
        navForwardBtn.addEventListener('click', goForward);

        // Handle dynamic choice input changes
        choicesContainer.addEventListener('input', handleChoiceInput);
        choicesContainer.addEventListener('click', handleRemoveChoice);
        choicesContainer.addEventListener('keydown', handleChoiceKeydown);
        
        // Auto-save on textarea changes
        document.addEventListener('input', (event) => {
            if (event.target.tagName === 'TEXTAREA') {
                saveData();
            }
        });
        
        // Handle plus/minus buttons and editable values
        document.addEventListener('click', handleValueButtonClick);
        document.addEventListener('blur', handleEditableValueBlur, true);
        document.addEventListener('keydown', handleEditableValueKeydown);
        
        // Keyboard shortcuts for navigation
        document.addEventListener('keydown', handleNavigationKeydown);
    }


    function addChoice() {
        const choiceDiv = document.createElement('div');
        choiceDiv.className = 'choice-input';
        choiceDiv.innerHTML = `
            <input type="text" class="choice" placeholder="Enter an option...">
            <button class="remove-choice">×</button>
        `;
        choicesContainer.appendChild(choiceDiv);
        
        // Focus on the new input
        const newInput = choiceDiv.querySelector('.choice');
        newInput.focus();
    }

    function handleChoiceInput(event) {
        if (event.target.classList.contains('choice')) {
            updateChoices();
            saveData();
        }
    }

    function handleRemoveChoice(event) {
        if (event.target.classList.contains('remove-choice')) {
            const choiceInputs = document.querySelectorAll('.choice-input');
            if (choiceInputs.length > 1) {
                event.target.parentElement.remove();
                updateChoices();
                saveData();
            }
        }
    }

    function handleChoiceKeydown(event) {
        if (event.target.classList.contains('choice') && event.key === 'Enter') {
            event.preventDefault();
            
            // Only add a new choice if the current input has content
            if (event.target.value.trim() !== '') {
                addChoice();
            }
        }
    }

    function updateChoices() {
        const choiceInputs = document.querySelectorAll('.choice');
        choices = Array.from(choiceInputs)
            .map(input => input.value.trim())
            .filter(value => value !== '');
        
        // Enable/disable proceed button based on number of choices
        proceedToComparisonBtn.disabled = choices.length < 2;
    }

    function proceedToComparison() {
        if (choices.length < 2) {
            alert('Please enter at least 2 options to compare.');
            announceToScreenReader('Error: Please enter at least 2 options to compare.', 'assertive');
            return;
        }

        // If exactly 2 options, skip selection step and go directly to comparison
        if (choices.length === 2) {
            selectedOptionA = choices[0];
            selectedOptionB = choices[1];
            
            // Update titles in comparison section
            document.getElementById('option-a-title').textContent = selectedOptionA;
            document.getElementById('option-b-title').textContent = selectedOptionB;
            
            // Clear any existing text in the textareas
            document.getElementById('advantages-a').value = '';
            document.getElementById('disadvantages-a').value = '';
            document.getElementById('advantages-b').value = '';
            document.getElementById('disadvantages-b').value = '';
            
            announceToScreenReader(`Now comparing ${selectedOptionA} versus ${selectedOptionB}`);
            
            saveData(true);
            showSection(comparisonSection);
            return;
        }

        // For 3+ options, show selection step
        populateSelectors();
        announceToScreenReader('Please select two options to compare from your list');
        showSection(selectionSection);
    }

    function populateSelectors() {
        // Clear existing options
        optionASelect.innerHTML = '<option value="">Select an option...</option>';
        optionBSelect.innerHTML = '<option value="">Select an option...</option>';

        // Add choices to both selectors
        choices.forEach(choice => {
            const optionA = document.createElement('option');
            optionA.value = choice;
            optionA.textContent = choice;
            optionASelect.appendChild(optionA);

            const optionB = document.createElement('option');
            optionB.value = choice;
            optionB.textContent = choice;
            optionBSelect.appendChild(optionB);
        });

        // Add event listeners to prevent selecting the same option
        optionASelect.addEventListener('change', updateAvailableOptions);
        optionBSelect.addEventListener('change', updateAvailableOptions);
    }

    function updateAvailableOptions() {
        const selectedA = optionASelect.value;
        const selectedB = optionBSelect.value;

        // Enable start comparison button only if both options are selected and different
        startComparisonBtn.disabled = !selectedA || !selectedB || selectedA === selectedB;

        if (selectedA === selectedB && selectedA !== '') {
            alert('Please select two different options to compare.');
        }
    }

    function startComparison() {
        selectedOptionA = optionASelect.value;
        selectedOptionB = optionBSelect.value;

        if (!selectedOptionA || !selectedOptionB || selectedOptionA === selectedOptionB) {
            alert('Please select two different options to compare.');
            return;
        }

        // Update titles in comparison section
        document.getElementById('option-a-title').textContent = selectedOptionA;
        document.getElementById('option-b-title').textContent = selectedOptionB;

        // Clear any existing text in the textareas
        document.getElementById('advantages-a').value = '';
        document.getElementById('disadvantages-a').value = '';
        document.getElementById('advantages-b').value = '';
        document.getElementById('disadvantages-b').value = '';

        saveData(true);
        showSection(comparisonSection);
    }

    function proceedToScoring() {
        // Check if all textareas have content
        const textareas = [
            document.getElementById('advantages-a'),
            document.getElementById('disadvantages-a'),
            document.getElementById('advantages-b'),
            document.getElementById('disadvantages-b')
        ];

        const hasContent = textareas.every(textarea => textarea.value.trim() !== '');
        
        if (!hasContent) {
            const proceed = confirm('Some sections are empty. Are you sure you want to proceed to scoring?');
            if (!proceed) return;
        }

        // Update option names throughout the scoring section
        const optionASpans = [
            'internal-option-a', 'adv-a-label-1', 'dis-a-label-1', 
            'adv-a-label-2', 'dis-a-label-2', 'step1-adv-title', 'step1-dis-title',
            'step3-adv-a-title', 'step4-dis-a-title'
        ];
        const optionBSpans = [
            'internal-option-b', 'adv-b-label-1', 'dis-b-label-1',
            'adv-b-label-2', 'dis-b-label-2', 'step2-adv-title', 'step2-dis-title',
            'step3-adv-b-title', 'step4-dis-b-title'
        ];

        optionASpans.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = selectedOptionA;
        });

        optionBSpans.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = selectedOptionB;
        });

        // Get the written pros and cons
        const advantagesA = document.getElementById('advantages-a').value;
        const disadvantagesA = document.getElementById('disadvantages-a').value;
        const advantagesB = document.getElementById('advantages-b').value;
        const disadvantagesB = document.getElementById('disadvantages-b').value;

        // Populate step-specific reference sections
        // Step 1: Option A internal (advantages vs disadvantages of A)
        document.getElementById('step1-advantages').textContent = advantagesA || 'No advantages listed';
        document.getElementById('step1-disadvantages').textContent = disadvantagesA || 'No disadvantages listed';

        // Step 2: Option B internal (advantages vs disadvantages of B)
        document.getElementById('step2-advantages').textContent = advantagesB || 'No advantages listed';
        document.getElementById('step2-disadvantages').textContent = disadvantagesB || 'No disadvantages listed';

        // Step 3: Advantages comparison (advantages of A vs advantages of B)
        document.getElementById('step3-advantages-a').textContent = advantagesA || 'No advantages listed';
        document.getElementById('step3-advantages-b').textContent = advantagesB || 'No advantages listed';

        // Step 4: Disadvantages comparison (disadvantages of A vs disadvantages of B)
        document.getElementById('step4-disadvantages-a').textContent = disadvantagesA || 'No disadvantages listed';
        document.getElementById('step4-disadvantages-b').textContent = disadvantagesB || 'No disadvantages listed';

        // Reset all steppers to 50/50
        const steppers = [
            'stepper-1-advantages', 'stepper-1-disadvantages',
            'stepper-2-advantages', 'stepper-2-disadvantages', 
            'stepper-3-option-a', 'stepper-3-option-b',
            'stepper-4-option-a', 'stepper-4-option-b'
        ];
        steppers.forEach(stepperId => {
            const stepper = document.getElementById(stepperId);
            if (stepper) {
                stepper.value = 50;
            }
        });

        // Initialize steppers and set up listeners
        initializeSteppers();
        setupComparisonInputListeners();

        showSection(scoringSection);
    }

    // Stepper functionality
    function setupComparisonInputListeners() {
        // Set up listeners for each stepper group
        const stepperGroups = [
            ['stepper-1-advantages', 'stepper-1-disadvantages', 'total-1', 'total-1-status'],
            ['stepper-2-advantages', 'stepper-2-disadvantages', 'total-2', 'total-2-status'],
            ['stepper-3-option-a', 'stepper-3-option-b', 'total-3', 'total-3-status'],
            ['stepper-4-option-a', 'stepper-4-option-b', 'total-4', 'total-4-status']
        ];

        stepperGroups.forEach(([input1Id, input2Id, totalId, statusId]) => {
            const input1 = document.getElementById(input1Id);
            const input2 = document.getElementById(input2Id);

            if (input1 && input2) {
                // Set up input change listeners with changed input ID
                input1.addEventListener('input', () => handleStepperChange(input1Id, input1Id, input2Id, totalId, statusId));
                input2.addEventListener('input', () => handleStepperChange(input2Id, input1Id, input2Id, totalId, statusId));
                
                // Set up button click listeners
                setupStepperButtons(input1Id);
                setupStepperButtons(input2Id);
            }
        });
    }

    function handleStepperChange(changedInputId, input1Id, input2Id, totalId, statusId) {
        const input1 = document.getElementById(input1Id);
        const input2 = document.getElementById(input2Id);
        const totalElement = document.getElementById(totalId);
        const statusElement = document.getElementById(statusId);
        
        if (!input1 || !input2 || !totalElement || !statusElement) return;
        
        const changedInput = document.getElementById(changedInputId);
        const otherInput = changedInputId === input1Id ? input2 : input1;
        
        if (!changedInput || !otherInput) return;
        
        // Get the value that was just changed
        let changedValue = parseInt(changedInput.value) || 0;
        
        // Ensure changed value is within bounds
        changedValue = Math.max(0, Math.min(100, changedValue));
        changedInput.value = changedValue;
        
        // Auto-balance: set other input to make total = 100
        const otherValue = 100 - changedValue;
        const oldOtherValue = parseInt(otherInput.value) || 0;
        
        // Only update if the other value actually needs to change
        if (oldOtherValue !== otherValue) {
            otherInput.value = otherValue;
            
            // Add visual feedback to show the auto-adjustment
            otherInput.classList.add('auto-adjusted');
            setTimeout(() => {
                otherInput.classList.remove('auto-adjusted');
            }, 800);
        }
        
        // Update total display (always 100 now)
        totalElement.textContent = '100';
        
        // Update status indicator (always valid now)
        statusElement.textContent = '✓';
        statusElement.className = 'total-status valid';
        
        // Auto-balance if one input changes (optional feature)
        // Commented out to preserve user intent
        /*
        if (document.activeElement === input1) {
            input2.value = Math.max(0, 100 - value1);
        } else if (document.activeElement === input2) {
            input1.value = Math.max(0, 100 - value2);
        }
        */
        
        saveData();
    }
    
    function setupStepperButtons(inputId) {
        const input = document.getElementById(inputId);
        if (!input) return;
        
        // Find the stepper buttons for this input
        const stepperControl = input.parentElement;
        const minusBtn = stepperControl.querySelector('.stepper-btn.minus');
        const plusBtn = stepperControl.querySelector('.stepper-btn.plus');
        
        if (minusBtn) {
            minusBtn.addEventListener('click', () => adjustStepperValue(inputId, -5));
        }
        
        if (plusBtn) {
            plusBtn.addEventListener('click', () => adjustStepperValue(inputId, 5));
        }
    }
    
    function adjustStepperValue(inputId, change) {
        const input = document.getElementById(inputId);
        if (!input) return;
        
        const currentValue = parseInt(input.value) || 0;
        const newValue = Math.max(0, Math.min(100, currentValue + change));
        
        input.value = newValue;
        
        // Trigger change event to update totals
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function updateSliderBackground(slider) {
        const value = slider.value;
        // Reverse the background to match the new logic: right movement = more right color
        const percentage = 100 - value;
        slider.style.background = `linear-gradient(to right, #2196f3 0%, #2196f3 ${percentage}%, #ff6b35 ${percentage}%, #ff6b35 100%)`;
    }

    function initializeSteppers() {
        // Initialize all stepper totals
        const stepperGroups = [
            ['stepper-1-advantages', 'stepper-1-disadvantages', 'total-1', 'total-1-status'],
            ['stepper-2-advantages', 'stepper-2-disadvantages', 'total-2', 'total-2-status'],
            ['stepper-3-option-a', 'stepper-3-option-b', 'total-3', 'total-3-status'],
            ['stepper-4-option-a', 'stepper-4-option-b', 'total-4', 'total-4-status']
        ];

        stepperGroups.forEach(([input1Id, input2Id, totalId, statusId]) => {
            // Use input1Id as the "changed" input to trigger auto-balancing on initialization
            handleStepperChange(input1Id, input1Id, input2Id, totalId, statusId);
        });
    }
    
    function validateStepperTotals() {
        const stepperGroups = [
            { 
                inputs: ['stepper-1-advantages', 'stepper-1-disadvantages'], 
                totalId: 'total-1', 
                stepName: 'Step 1: Compare within Option A' 
            },
            { 
                inputs: ['stepper-2-advantages', 'stepper-2-disadvantages'], 
                totalId: 'total-2', 
                stepName: 'Step 2: Compare within Option B' 
            },
            { 
                inputs: ['stepper-3-option-a', 'stepper-3-option-b'], 
                totalId: 'total-3', 
                stepName: 'Step 3: Compare Advantages' 
            },
            { 
                inputs: ['stepper-4-option-a', 'stepper-4-option-b'], 
                totalId: 'total-4', 
                stepName: 'Step 4: Compare Disadvantages' 
            }
        ];

        const invalidGroups = [];
        
        stepperGroups.forEach((group, index) => {
            const [input1Id, input2Id] = group.inputs;
            const input1 = document.getElementById(input1Id);
            const input2 = document.getElementById(input2Id);
            
            if (input1 && input2) {
                const value1 = parseInt(input1.value) || 0;
                const value2 = parseInt(input2.value) || 0;
                const total = value1 + value2;
                
                if (total !== 100) {
                    invalidGroups.push({
                        stepNumber: index + 1,
                        stepName: group.stepName,
                        total: total,
                        totalId: group.totalId,
                        firstInputId: input1Id
                    });
                }
            }
        });

        return {
            isValid: invalidGroups.length === 0,
            invalidGroups: invalidGroups,
            totalSteps: stepperGroups.length
        };
    }
    
    function showValidationError(invalidGroups) {
        // Create user-friendly error message
        let errorMessage = 'Please ensure all point allocations total exactly 100 before calculating results.\n\n';
        
        if (invalidGroups.length === 1) {
            const group = invalidGroups[0];
            errorMessage += `${group.stepName} currently totals ${group.total} points instead of 100.`;
        } else {
            errorMessage += 'The following steps need adjustment:\n';
            invalidGroups.forEach(group => {
                errorMessage += `• ${group.stepName}: ${group.total} points\n`;
            });
            errorMessage += '\nEach comparison must total exactly 100 points.';
        }
        
        // Show alert with error message
        alert(errorMessage);
        announceToScreenReader(errorMessage, 'assertive');
        
        // Focus on the first invalid input
        if (invalidGroups.length > 0) {
            const firstInvalidInput = document.getElementById(invalidGroups[0].firstInputId);
            if (firstInvalidInput) {
                firstInvalidInput.focus();
                firstInvalidInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        
        // Add visual indicators to invalid groups
        addValidationVisualIndicators(invalidGroups);
    }
    
    function addValidationVisualIndicators(invalidGroups) {
        // First, clear any existing error indicators
        clearValidationVisualIndicators();
        
        // Add error styling to invalid groups
        invalidGroups.forEach(group => {
            const totalElement = document.getElementById(group.totalId);
            if (totalElement) {
                const stepperTotal = totalElement.closest('.stepper-total');
                if (stepperTotal) {
                    stepperTotal.classList.add('validation-error');
                }
            }
        });
        
        // Remove error indicators after 5 seconds
        setTimeout(clearValidationVisualIndicators, 5000);
    }
    
    function clearValidationVisualIndicators() {
        const errorElements = document.querySelectorAll('.validation-error');
        errorElements.forEach(element => {
            element.classList.remove('validation-error');
        });
    }

    function calculateResult() {
        // Note: Validation should rarely be needed since auto-balancing ensures totals = 100
        // but keeping as safeguard for any edge cases
        const validation = validateStepperTotals();
        
        if (!validation.isValid) {
            showValidationError(validation.invalidGroups);
            return; // Prevent calculation until all totals are valid
        }
        
        // Get values from stepper inputs
        const circle1 = parseInt(document.getElementById('stepper-1-advantages').value) || 50;    // Advantages A internal
        const circle2 = parseInt(document.getElementById('stepper-1-disadvantages').value) || 50; // Disadvantages A internal
        const circle3 = parseInt(document.getElementById('stepper-2-advantages').value) || 50;    // Advantages B internal  
        const circle4 = parseInt(document.getElementById('stepper-2-disadvantages').value) || 50; // Disadvantages B internal
        const circle5 = parseInt(document.getElementById('stepper-3-option-a').value) || 50;      // Advantages A vs B
        const circle6 = parseInt(document.getElementById('stepper-3-option-b').value) || 50;      // Advantages B vs A
        const circle7 = parseInt(document.getElementById('stepper-4-option-a').value) || 50;      // Disadvantages A vs B
        const circle8 = parseInt(document.getElementById('stepper-4-option-b').value) || 50;      // Disadvantages B vs A

        // Calculate final scores using PDF methodology
        // Option A: (circle1 + circle5) - (circle2 + circle7)
        // Option B: (circle3 + circle6) - (circle4 + circle8)
        const circle9 = circle1 + circle5; // Total advantages for A
        const circle10 = circle2 + circle7; // Total disadvantages for A
        const circle11 = circle3 + circle6; // Total advantages for B
        const circle12 = circle4 + circle8; // Total disadvantages for B

        const optionAScore = circle9 - circle10;
        const optionBScore = circle11 - circle12;

        // Get the text content for display
        const advantagesA = document.getElementById('advantages-a').value;
        const disadvantagesA = document.getElementById('disadvantages-a').value;
        const advantagesB = document.getElementById('advantages-b').value;
        const disadvantagesB = document.getElementById('disadvantages-b').value;

        // Generate results
        displayResults({
            optionA: selectedOptionA,
            optionB: selectedOptionB,
            circles: {
                circle1, circle2, circle3, circle4,
                circle5, circle6, circle7, circle8,
                circle9, circle10, circle11, circle12
            },
            scores: {
                optionAScore,
                optionBScore
            },
            content: {
                advantagesA,
                disadvantagesA,
                advantagesB,
                disadvantagesB
            }
        });

        // Announce results
        const winner = optionAScore > optionBScore ? selectedOptionA : 
                      optionBScore > optionAScore ? selectedOptionB : 'tie';
        if (winner === 'tie') {
            announceToScreenReader('Results calculated. The decision is too close to call.');
        } else {
            announceToScreenReader(`Results calculated. Recommended choice: ${winner}`);
        }

        showSection(resultsSection);
    }

    function displayResults(data) {
        const resultsContent = document.getElementById('results-content');
        const { optionAScore, optionBScore } = data.scores;
        const { circles } = data;
        
        // Determine decision type based on PDF methodology
        let decisionType = '';
        let decisionColor = '';
        let winner = null;
        
        if (optionAScore > optionBScore) {
            winner = data.optionA;
        } else if (optionBScore > optionAScore) {
            winner = data.optionB;
        }

        // Classify decision type
        if ((optionAScore > 50 && optionBScore < -50) || (optionBScore > 50 && optionAScore < -50)) {
            decisionType = 'No Brainer';
            decisionColor = '#48bb78';
        } else if (Math.abs(optionAScore - optionBScore) <= 20) {
            decisionType = 'Fence Sitter';
            decisionColor = '#9f7aea';
        } else if (optionAScore > 0 && optionBScore > 0) {
            decisionType = "Can't Lose";
            decisionColor = '#38b2ac';
        } else if (optionAScore < 0 && optionBScore < 0) {
            decisionType = "Can't Win";
            decisionColor = '#ed8936';
        } else {
            decisionType = 'Clear Choice';
            decisionColor = '#667eea';
        }

        let resultsHTML = `
            <div class="result-item" style="text-align: center; background: linear-gradient(135deg, ${decisionColor}20, ${decisionColor}10); border-left-color: ${decisionColor};">
                <h3 style="color: ${decisionColor};">${decisionType}</h3>
                ${winner ? `<p><strong>Recommended Choice:</strong> ${winner}<br><span style="font-size: 1.2rem; font-weight: 600; color: ${decisionColor};">${winner === data.optionA ? optionAScore : optionBScore} points</span></p>` : '<p><strong>Decision is too close to call</strong></p>'}
            </div>

            <div class="result-item ${winner === data.optionA ? 'winner' : ''}">
                <h3>${data.optionA}</h3>
                <p><strong>Total Points:</strong> ${optionAScore} (Range: -200 to +200)</p>
                <p><strong>Advantages Total:</strong> ${circles.circle9} points</p>
                <p><strong>Disadvantages Total:</strong> ${circles.circle10} points</p>
            </div>
            
            <div class="result-item ${winner === data.optionB ? 'winner' : ''}">
                <h3>${data.optionB}</h3>
                <p><strong>Total Points:</strong> ${optionBScore} (Range: -200 to +200)</p>
                <p><strong>Advantages Total:</strong> ${circles.circle11} points</p>
                <p><strong>Disadvantages Total:</strong> ${circles.circle12} points</p>
            </div>
            
            <details style="margin-top: 20px;">
                <summary style="cursor: pointer; font-weight: bold; padding: 10px; background: #f7fafc; border-radius: 5px;">
                    Decision Type Explanations
                </summary>
                <div style="padding: 15px; background: #f7fafc; margin-top: 10px; border-radius: 5px; font-size: 0.9rem;">
                    <p><strong>No Brainer:</strong> One option is strongly positive while the other is strongly negative</p>
                    <p><strong>Can't Lose:</strong> Both options have positive scores - either choice is good</p>
                    <p><strong>Can't Win:</strong> Both options have negative scores - difficult situation</p>
                    <p><strong>Fence Sitter:</strong> Scores are very close to each other or zero</p>
                    <p><strong>Clear Choice:</strong> One option is notably better than the other</p>
                </div>
            </details>

            <details style="margin-top: 10px;">
                <summary style="cursor: pointer; font-weight: bold; padding: 10px; background: #f7fafc; border-radius: 5px;">
                    View Your Written Analysis
                </summary>
                <div style="padding: 15px; background: #f7fafc; margin-top: 10px; border-radius: 5px;">
                    <h4>${data.optionA} - Advantages:</h4>
                    <p style="margin-bottom: 15px; white-space: pre-wrap;">${data.content.advantagesA || 'No advantages listed'}</p>
                    
                    <h4>${data.optionA} - Disadvantages:</h4>
                    <p style="margin-bottom: 15px; white-space: pre-wrap;">${data.content.disadvantagesA || 'No disadvantages listed'}</p>
                    
                    <h4>${data.optionB} - Advantages:</h4>
                    <p style="margin-bottom: 15px; white-space: pre-wrap;">${data.content.advantagesB || 'No advantages listed'}</p>
                    
                    <h4>${data.optionB} - Disadvantages:</h4>
                    <p style="white-space: pre-wrap;">${data.content.disadvantagesB || 'No disadvantages listed'}</p>
                </div>
            </details>
        `;

        resultsContent.innerHTML = resultsHTML;
    }

    function showSection(targetSection, skipHistory = false) {
        // Add to navigation history unless explicitly skipped (for undo/redo operations)
        if (!skipHistory) {
            addToNavigationHistory(targetSection);
        }
        
        // Hide all sections
        [brainstormSection, selectionSection, comparisonSection, scoringSection, resultsSection]
            .forEach(section => section.classList.add('hidden'));
        
        // Show target section
        targetSection.classList.remove('hidden');
        
        // Update navigation buttons
        updateNavigationButtons();
        
        // Announce section change to screen readers
        const sectionHeading = targetSection.querySelector('h2');
        if (sectionHeading && !skipHistory) {
            announceToScreenReader(`Navigated to ${sectionHeading.textContent}`);
        }
        
        // Focus management - focus on the main heading of the new section
        if (sectionHeading) {
            sectionHeading.focus();
            sectionHeading.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        // Scroll to top
        window.scrollTo(0, 0);
    }

    function startOver() {
        // Reset all data
        choices = [];
        selectedOptionA = '';
        selectedOptionB = '';
        
        // Clear all inputs
        const choiceInputs = document.querySelectorAll('.choice');
        choiceInputs.forEach(input => input.value = '');
        
        // Reset to first section
        showSection(brainstormSection);
        
        // Focus on first input
        if (choiceInputs.length > 0) {
            choiceInputs[0].focus();
        }
    }

    function universalStartOver() {
        // Clear saved data and navigation history
        clearSavedData();
        navigationHistory = [];
        currentHistoryIndex = -1;
        
        // Clear all form data first
        document.querySelectorAll('input, textarea').forEach(element => {
            element.value = '';
        });
        
        // Try multiple reload methods for maximum reliability
        try {
            // Method 1: Force reload with cache bypass
            window.location.reload(true);
        } catch (e) {
            try {
                // Method 2: Replace current location
                window.location.replace(window.location.href);
            } catch (e2) {
                // Method 3: Assign new location (fallback)
                window.location.href = window.location.pathname + window.location.search;
            }
        }
    }

    function shareResults() {
        const resultData = generateShareText();
        
        // Try to use the Web Share API if available (mobile devices)
        if (navigator.share) {
            navigator.share({
                title: 'My Decision Analysis Results',
                text: resultData.text,
                url: window.location.href
            }).catch(err => {
                console.log('Error sharing:', err);
                fallbackShare(resultData.text);
            });
        } else {
            fallbackShare(resultData.text);
        }
    }

    function fallbackShare(text) {
        // Copy to clipboard as fallback
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                showShareFeedback('Results copied to clipboard! 📋');
            }).catch(() => {
                showTextAreaShare(text);
            });
        } else {
            showTextAreaShare(text);
        }
    }

    function showTextAreaShare(text) {
        // Create a modal with the shareable text
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 12px;
            max-width: 500px;
            width: 90%;
            max-height: 80%;
            overflow-y: auto;
        `;

        modalContent.innerHTML = `
            <h3 style="margin-top: 0; color: #2d3748;">Share Your Decision Analysis</h3>
            <textarea style="width: 100%; height: 200px; padding: 10px; border: 2px solid #e2e8f0; border-radius: 6px; font-family: monospace; font-size: 0.9rem; resize: vertical;" readonly>${text}</textarea>
            <div style="margin-top: 15px; display: flex; gap: 10px; justify-content: flex-end;">
                <button id="copy-text-btn" style="background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">Copy Text</button>
                <button id="close-modal-btn" style="background: #718096; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">Close</button>
            </div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Event listeners for modal
        document.getElementById('copy-text-btn').addEventListener('click', () => {
            const textarea = modalContent.querySelector('textarea');
            textarea.select();
            document.execCommand('copy');
            showShareFeedback('Results copied to clipboard! 📋');
            document.body.removeChild(modal);
        });

        document.getElementById('close-modal-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    function showShareFeedback(message) {
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #48bb78;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 1001;
            font-weight: 600;
        `;
        feedback.textContent = message;
        document.body.appendChild(feedback);

        setTimeout(() => {
            if (document.body.contains(feedback)) {
                document.body.removeChild(feedback);
            }
        }, 3000);
    }

    function generateShareText() {
        // Get the current results data
        const resultsContent = document.getElementById('results-content');
        const decisionType = resultsContent.querySelector('h3').textContent;
        const winner = resultsContent.querySelector('p strong')?.nextSibling?.textContent?.trim();
        
        // Get the scores from the result items
        const resultItems = resultsContent.querySelectorAll('.result-item');
        let optionAScore, optionBScore;
        
        resultItems.forEach(item => {
            const scoreText = item.querySelector('p')?.textContent;
            if (scoreText && scoreText.includes('Total Points:')) {
                const score = scoreText.match(/Total Points:\s*(-?\d+)/);
                if (score) {
                    if (item.textContent.includes(selectedOptionA)) {
                        optionAScore = score[1];
                    } else if (item.textContent.includes(selectedOptionB)) {
                        optionBScore = score[1];
                    }
                }
            }
        });

        const text = `🎯 Decision Analysis Results

📊 Decision Type: ${decisionType}
${winner ? `🏆 Recommended Choice: ${winner}` : '⚖️ Decision is too close to call'}

📈 Final Scores:
• ${selectedOptionA}: ${optionAScore} points
• ${selectedOptionB}: ${optionBScore} points

Made with Decision Helper 🧠✨`;

        return { text };
    }

    function savePDF() {
        // Expand all details elements for PDF
        document.querySelectorAll('details').forEach(details => {
            details.open = true;
        });

        // Force layout recalculation and ensure results section is visible
        const resultsSection = document.getElementById('results-section');
        if (resultsSection) {
            resultsSection.style.display = 'block';
            resultsSection.style.visibility = 'visible';
            // Force a reflow
            resultsSection.offsetHeight;
        }

        // Use requestAnimationFrame for better timing, with fallback
        const printDocument = () => {
            // Double-check that content is ready
            if (document.getElementById('results-content')?.children.length > 0) {
                window.print();
            } else {
                // Fallback delay if content isn't ready
                setTimeout(() => window.print(), 200);
            }
        };

        if (window.requestAnimationFrame) {
            requestAnimationFrame(() => {
                requestAnimationFrame(printDocument);
            });
        } else {
            setTimeout(printDocument, 150);
        }
    }

    // Dev Mode Functions
    function checkDevModeHash() {
        const hash = window.location.hash.substring(1); // Remove the #
        console.log('Full URL:', window.location.href);
        console.log('Hash part:', window.location.hash);
        console.log('Dev mode hash detected:', hash); // Debug log
        
        if (!hash) {
            console.log('No hash found in URL');
            return;
        }
        
        switch(hash) {
            case 'selection':
                console.log('Setting up selection mock data');
                setTimeout(setupMockDataForSelection, 200);
                break;
            case 'comparison':
                console.log('Setting up comparison mock data');
                setTimeout(setupMockDataForComparison, 200);
                break;
            case 'scoring':
                console.log('Setting up scoring mock data');
                setTimeout(setupMockDataForScoring, 200);
                break;
            case 'results':
                console.log('Setting up results mock data');
                setTimeout(setupMockDataForResults, 200);
                break;
            default:
                console.log('Unknown dev mode hash:', hash);
                break;
        }
    }

    function getMockData() {
        return {
            choices: ['Take the new job', 'Stay at current company', 'Start freelancing'],
            selectedOptionA: 'Take the new job',
            selectedOptionB: 'Stay at current company',
            advantagesA: 'Higher salary\nNew challenges\nBetter work-life balance\nOpportunity for growth',
            disadvantagesA: 'Unknown work culture\nLonger commute\nNeed to learn new systems\nLeaving established relationships',
            advantagesB: 'Familiar environment\nEstablished relationships\nShort commute\nKnown expectations',
            disadvantagesB: 'Limited growth opportunities\nLower pay\nRepetitive work\nHigh stress levels'
        };
    }

    function setupMockDataForSelection() {
        const mockData = getMockData();
        console.log('Setting up selection with data:', mockData);
        
        // Make sure we have enough choice inputs
        while (document.querySelectorAll('.choice').length < mockData.choices.length) {
            addChoice();
        }
        
        // Fill in the choice inputs
        const choiceInputs = document.querySelectorAll('.choice');
        mockData.choices.forEach((choice, index) => {
            if (choiceInputs[index]) {
                choiceInputs[index].value = choice;
                console.log(`Set choice ${index} to:`, choice);
            }
        });
        
        // Update choices array and enable button
        updateChoices(); // Use existing function to update choices array
        
        // Navigate to selection
        populateSelectors();
        showSection(selectionSection);
        console.log('Navigated to selection section');
    }

    function setupMockDataForComparison() {
        const mockData = getMockData();
        console.log('Setting up comparison with data:', mockData);
        
        // Set up everything for comparison
        choices = [...mockData.choices];
        selectedOptionA = mockData.selectedOptionA;
        selectedOptionB = mockData.selectedOptionB;
        
        // Update titles
        document.getElementById('option-a-title').textContent = selectedOptionA;
        document.getElementById('option-b-title').textContent = selectedOptionB;
        
        // Navigate to comparison
        showSection(comparisonSection);
        console.log('Navigated to comparison section');
    }

    function setupMockDataForScoring() {
        const mockData = getMockData();
        console.log('Setting up scoring with data:', mockData);
        
        // Set up everything including pros/cons
        choices = [...mockData.choices];
        selectedOptionA = mockData.selectedOptionA;
        selectedOptionB = mockData.selectedOptionB;
        
        // Fill in the textareas
        document.getElementById('advantages-a').value = mockData.advantagesA;
        document.getElementById('disadvantages-a').value = mockData.disadvantagesA;
        document.getElementById('advantages-b').value = mockData.advantagesB;
        document.getElementById('disadvantages-b').value = mockData.disadvantagesB;
        
        // Set up scoring section as if we just came from comparison
        proceedToScoring();
        console.log('Set up scoring section');
    }

    function setupMockDataForResults() {
        const mockData = getMockData();
        console.log('Setting up results with data:', mockData);
        
        // Set up everything
        choices = [...mockData.choices];
        selectedOptionA = mockData.selectedOptionA;
        selectedOptionB = mockData.selectedOptionB;
        
        // Fill in the textareas
        document.getElementById('advantages-a').value = mockData.advantagesA;
        document.getElementById('disadvantages-a').value = mockData.disadvantagesA;
        document.getElementById('advantages-b').value = mockData.advantagesB;
        document.getElementById('disadvantages-b').value = mockData.disadvantagesB;
        
        // Set some sample slider values for realistic results
        document.getElementById('slider-1-2').value = 70; // Option A internal: 70 adv, 30 dis
        document.getElementById('slider-3-4').value = 40; // Option B internal: 40 adv, 60 dis
        document.getElementById('slider-5-6').value = 60; // Advantages comparison: 60 A, 40 B
        document.getElementById('slider-7-8').value = 30; // Disadvantages comparison: 30 A, 70 B
        
        // Update slider displays
        const sliders = document.querySelectorAll('.comparison-slider');
        sliders.forEach(slider => {
            const event = new Event('input', { bubbles: true });
            slider.dispatchEvent(event);
        });
        
        // Calculate and show results
        calculateResult();
        console.log('Generated results section');
    }

    // Value Button and Editable Value Handlers
    function handleValueButtonClick(event) {
        if (!event.target.classList.contains('value-btn')) return;
        
        const targetId = event.target.getAttribute('data-target');
        const valueElement = document.getElementById(targetId);
        const isPlus = event.target.classList.contains('plus');
        const isMinus = event.target.classList.contains('minus');
        
        if (!valueElement) return;
        
        let currentValue = parseInt(valueElement.textContent) || 0;
        let newValue = currentValue;
        
        if (isPlus) {
            newValue = Math.min(100, currentValue + 5);
        } else if (isMinus) {
            newValue = Math.max(0, currentValue - 5);
        }
        
        if (newValue !== currentValue) {
            updateValueAndSlider(targetId, newValue);
        }
    }
    
    function handleEditableValueBlur(event) {
        if (!event.target.classList.contains('editable-value')) return;
        
        const valueElement = event.target;
        const newValue = parseInt(valueElement.textContent) || 0;
        const clampedValue = Math.max(0, Math.min(100, newValue));
        
        if (newValue !== clampedValue) {
            valueElement.textContent = clampedValue;
        }
        
        updateValueAndSlider(valueElement.id, clampedValue);
    }
    
    function handleEditableValueKeydown(event) {
        if (!event.target.classList.contains('editable-value')) return;
        
        // Handle Enter key to blur and apply changes
        if (event.key === 'Enter') {
            event.preventDefault();
            event.target.blur();
        }
        
        // Only allow numeric input
        if (event.key.length === 1 && !/[0-9]/.test(event.key) && !event.ctrlKey && !event.metaKey) {
            event.preventDefault();
        }
    }
    
    function updateValueAndSlider(valueId, newValue) {
        const valueElement = document.getElementById(valueId);
        valueElement.textContent = newValue;
        
        // Find the corresponding slider and other value
        let sliderId, otherValueId, isLeftValue;
        
        if (valueId === 'value-1' || valueId === 'value-2') {
            sliderId = 'slider-1-2';
            otherValueId = valueId === 'value-1' ? 'value-2' : 'value-1';
            isLeftValue = valueId === 'value-1';
        } else if (valueId === 'value-3' || valueId === 'value-4') {
            sliderId = 'slider-3-4';
            otherValueId = valueId === 'value-3' ? 'value-4' : 'value-3';
            isLeftValue = valueId === 'value-3';
        } else if (valueId === 'value-5' || valueId === 'value-6') {
            sliderId = 'slider-5-6';
            otherValueId = valueId === 'value-5' ? 'value-6' : 'value-5';
            isLeftValue = valueId === 'value-5';
        } else if (valueId === 'value-7' || valueId === 'value-8') {
            sliderId = 'slider-7-8';
            otherValueId = valueId === 'value-7' ? 'value-8' : 'value-7';
            isLeftValue = valueId === 'value-7';
        }
        
        if (sliderId && otherValueId) {
            const slider = document.getElementById(sliderId);
            const otherValueElement = document.getElementById(otherValueId);
            
            // Update slider position (reverse logic: left value controls 100-slider, right value controls slider)
            if (isLeftValue) {
                slider.value = 100 - newValue;
            } else {
                slider.value = newValue;
            }
            
            // Update other value to maintain balance
            const otherValue = 100 - newValue;
            otherValueElement.textContent = otherValue;
            
            // Update slider background
            updateSliderBackground(slider);
        }
    }

    function handleNavigationKeydown(event) {
        // Only handle navigation keys if user isn't typing in an input/textarea
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        // Alt + Left Arrow = Go Back
        if (event.altKey && event.key === 'ArrowLeft') {
            event.preventDefault();
            goBack();
        }
        
        // Alt + Right Arrow = Go Forward
        if (event.altKey && event.key === 'ArrowRight') {
            event.preventDefault();
            goForward();
        }
    }

    // Save/Load functionality
    function saveData(showIndicator = false) {
        const data = {
            choices: [...choices],
            selectedOptionA,
            selectedOptionB,
            currentSection: getCurrentSection(),
            formData: {
                choiceInputs: Array.from(document.querySelectorAll('.choice')).map(input => input.value),
                advantagesA: document.getElementById('advantages-a')?.value || '',
                disadvantagesA: document.getElementById('disadvantages-a')?.value || '',
                advantagesB: document.getElementById('advantages-b')?.value || '',
                disadvantagesB: document.getElementById('disadvantages-b')?.value || '',
                stepperValues: {
                    'stepper-1-advantages': document.getElementById('stepper-1-advantages')?.value || 50,
                    'stepper-1-disadvantages': document.getElementById('stepper-1-disadvantages')?.value || 50,
                    'stepper-2-advantages': document.getElementById('stepper-2-advantages')?.value || 50,
                    'stepper-2-disadvantages': document.getElementById('stepper-2-disadvantages')?.value || 50,
                    'stepper-3-option-a': document.getElementById('stepper-3-option-a')?.value || 50,
                    'stepper-3-option-b': document.getElementById('stepper-3-option-b')?.value || 50,
                    'stepper-4-option-a': document.getElementById('stepper-4-option-a')?.value || 50,
                    'stepper-4-option-b': document.getElementById('stepper-4-option-b')?.value || 50
                }
            },
            navigationHistory: [...navigationHistory],
            currentHistoryIndex,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem('decisionHelperData', JSON.stringify(data));
            
            // Only show indicator if explicitly requested
            if (showIndicator) {
                showSaveIndicator();
            }
        } catch (e) {
            console.warn('Could not save data to localStorage:', e);
        }
    }

    function loadSavedData() {
        try {
            const savedData = localStorage.getItem('decisionHelperData');
            if (!savedData) return;

            const data = JSON.parse(savedData);

            // Restore choices array
            choices = [...data.choices];
            selectedOptionA = data.selectedOptionA;
            selectedOptionB = data.selectedOptionB;

            // Restore navigation history
            if (data.navigationHistory && Array.isArray(data.navigationHistory)) {
                navigationHistory = [...data.navigationHistory];
                currentHistoryIndex = data.currentHistoryIndex || -1;
            }

            // Restore form inputs
            if (data.formData.choiceInputs.length > 0) {
                // Add enough choice inputs
                while (document.querySelectorAll('.choice').length < data.formData.choiceInputs.length) {
                    addChoice();
                }

                // Fill choice inputs
                const choiceInputs = document.querySelectorAll('.choice');
                data.formData.choiceInputs.forEach((value, index) => {
                    if (choiceInputs[index]) {
                        choiceInputs[index].value = value;
                    }
                });
                updateChoices();
            }

            // Restore comparison textareas
            if (data.formData.advantagesA) document.getElementById('advantages-a').value = data.formData.advantagesA;
            if (data.formData.disadvantagesA) document.getElementById('disadvantages-a').value = data.formData.disadvantagesA;
            if (data.formData.advantagesB) document.getElementById('advantages-b').value = data.formData.advantagesB;
            if (data.formData.disadvantagesB) document.getElementById('disadvantages-b').value = data.formData.disadvantagesB;

            // Restore stepper values
            if (data.formData.stepperValues) {
                Object.entries(data.formData.stepperValues).forEach(([stepperId, value]) => {
                    const stepper = document.getElementById(stepperId);
                    if (stepper) {
                        stepper.value = value;
                    }
                });
                
                // Re-initialize steppers to update totals
                initializeSteppers();
            }

            // Navigate to the correct section (skip adding to history since we're restoring)
            navigateToSection(data.currentSection, true);
            
            // Update navigation buttons after restoring
            updateNavigationButtons();
            
            // Show restore notification
            showRestoreNotification();

        } catch (e) {
            console.warn('Could not load saved data:', e);
            localStorage.removeItem('decisionHelperData');
        }
    }

    function getCurrentSection() {
        if (!brainstormSection.classList.contains('hidden')) return 'brainstorm';
        if (!selectionSection.classList.contains('hidden')) return 'selection';
        if (!comparisonSection.classList.contains('hidden')) return 'comparison';
        if (!scoringSection.classList.contains('hidden')) return 'scoring';
        if (!resultsSection.classList.contains('hidden')) return 'results';
        return 'brainstorm';
    }

    function navigateToSection(sectionName, skipHistory = false) {
        switch (sectionName) {
            case 'selection':
                if (choices.length >= 3) {
                    populateSelectors();
                    showSection(selectionSection, skipHistory);
                }
                break;
            case 'comparison':
                if (selectedOptionA && selectedOptionB) {
                    document.getElementById('option-a-title').textContent = selectedOptionA;
                    document.getElementById('option-b-title').textContent = selectedOptionB;
                    showSection(comparisonSection, skipHistory);
                }
                break;
            case 'scoring':
                if (selectedOptionA && selectedOptionB) {
                    // For scoring, we need to call proceedToScoring but skip history
                    // This is tricky - we'll handle it specially
                    if (skipHistory) {
                        showSection(scoringSection, true);
                        setupComparisonInputListeners();
                        initializeSteppers();
                    } else {
                        proceedToScoring();
                    }
                }
                break;
            case 'results':
                if (selectedOptionA && selectedOptionB) {
                    // Similar handling for results
                    if (skipHistory) {
                        showSection(resultsSection, true);
                    } else {
                        calculateResult();
                    }
                }
                break;
            default:
                showSection(brainstormSection, skipHistory);
        }
    }

    function showSaveIndicator() {
        // Remove existing indicator
        const existing = document.getElementById('save-indicator');
        if (existing) existing.remove();

        const indicator = document.createElement('div');
        indicator.id = 'save-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #48bb78;
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 0.85rem;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        indicator.textContent = '✓ Progress saved';
        document.body.appendChild(indicator);

        // Fade in and out
        setTimeout(() => indicator.style.opacity = '1', 10);
        setTimeout(() => indicator.style.opacity = '0', 1500);
        setTimeout(() => indicator.remove(), 1800);
    }

    function showRestoreNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            background: #667eea;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 0.9rem;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        notification.innerHTML = `
            <div style="margin-bottom: 8px;">📂 Previous progress restored</div>
            <button id="clear-saved-btn" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
                Clear & Start Fresh
            </button>
        `;
        document.body.appendChild(notification);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.remove();
            }
        }, 5000);

        // Clear saved data button
        document.getElementById('clear-saved-btn').addEventListener('click', () => {
            localStorage.removeItem('decisionHelperData');
            universalStartOver();
        });
    }

    function clearSavedData() {
        localStorage.removeItem('decisionHelperData');
    }

    // Screen reader announcements
    function announceToScreenReader(message, priority = 'polite') {
        const announcer = document.getElementById('sr-announcements');
        if (announcer) {
            announcer.setAttribute('aria-live', priority);
            announcer.textContent = message;
            
            // Clear the message after a short delay to allow for new announcements
            setTimeout(() => {
                announcer.textContent = '';
            }, 1000);
        }
    }

    function updateAriaValueText(sliderId, leftValue, rightValue) {
        const slider = document.getElementById(sliderId);
        if (slider) {
            const leftLabel = slider.parentElement.querySelector('.slider-label-left')?.textContent || 'Left option';
            const rightLabel = slider.parentElement.querySelector('.slider-label-right')?.textContent || 'Right option';
            slider.setAttribute('aria-valuetext', `${leftValue} points to ${leftLabel}, ${rightValue} points to ${rightLabel}`);
        }
    }

    function updateSpinButtonValues(valueId, value) {
        const element = document.getElementById(valueId);
        if (element && element.hasAttribute('aria-valuenow')) {
            element.setAttribute('aria-valuenow', value);
        }
    }

    // Navigation History Functions
    function addToNavigationHistory(targetSection) {
        // Capture current state before navigating
        const currentState = captureCurrentState();
        
        // If we're not at the end of history, remove everything after current position
        if (currentHistoryIndex < navigationHistory.length - 1) {
            navigationHistory = navigationHistory.slice(0, currentHistoryIndex + 1);
        }
        
        // Add new state to history
        navigationHistory.push({
            section: getSectionName(targetSection),
            state: currentState,
            timestamp: Date.now()
        });
        
        // Limit history to 20 entries to prevent memory issues
        if (navigationHistory.length > 20) {
            navigationHistory = navigationHistory.slice(-20);
        }
        
        currentHistoryIndex = navigationHistory.length - 1;
    }

    function captureCurrentState() {
        return {
            choices: [...choices],
            selectedOptionA,
            selectedOptionB,
            formData: {
                choiceInputs: Array.from(document.querySelectorAll('.choice')).map(input => input.value),
                advantagesA: document.getElementById('advantages-a')?.value || '',
                disadvantagesA: document.getElementById('disadvantages-a')?.value || '',
                advantagesB: document.getElementById('advantages-b')?.value || '',
                disadvantagesB: document.getElementById('disadvantages-b')?.value || '',
                stepperValues: {
                    'stepper-1-advantages': document.getElementById('stepper-1-advantages')?.value || 50,
                    'stepper-1-disadvantages': document.getElementById('stepper-1-disadvantages')?.value || 50,
                    'stepper-2-advantages': document.getElementById('stepper-2-advantages')?.value || 50,
                    'stepper-2-disadvantages': document.getElementById('stepper-2-disadvantages')?.value || 50,
                    'stepper-3-option-a': document.getElementById('stepper-3-option-a')?.value || 50,
                    'stepper-3-option-b': document.getElementById('stepper-3-option-b')?.value || 50,
                    'stepper-4-option-a': document.getElementById('stepper-4-option-a')?.value || 50,
                    'stepper-4-option-b': document.getElementById('stepper-4-option-b')?.value || 50
                }
            }
        };
    }

    function getSectionName(sectionElement) {
        if (sectionElement === brainstormSection) return 'brainstorm';
        if (sectionElement === selectionSection) return 'selection';
        if (sectionElement === comparisonSection) return 'comparison';
        if (sectionElement === scoringSection) return 'scoring';
        if (sectionElement === resultsSection) return 'results';
        return 'brainstorm';
    }

    function getSectionElement(sectionName) {
        switch (sectionName) {
            case 'brainstorm': return brainstormSection;
            case 'selection': return selectionSection;
            case 'comparison': return comparisonSection;
            case 'scoring': return scoringSection;
            case 'results': return resultsSection;
            default: return brainstormSection;
        }
    }

    function canGoBack() {
        return currentHistoryIndex > 0;
    }

    function canGoForward() { 
        return currentHistoryIndex < navigationHistory.length - 1;
    }

    function goBack() {
        if (!canGoBack()) return;
        
        currentHistoryIndex--;
        const historyEntry = navigationHistory[currentHistoryIndex];
        restoreState(historyEntry.state);
        
        const targetSection = getSectionElement(historyEntry.section);
        showSection(targetSection, true); // Skip adding to history
    }

    function goForward() {
        if (!canGoForward()) return;
        
        currentHistoryIndex++;
        const historyEntry = navigationHistory[currentHistoryIndex];
        restoreState(historyEntry.state);
        
        const targetSection = getSectionElement(historyEntry.section);
        showSection(targetSection, true); // Skip adding to history
    }

    function restoreState(state) {
        // Restore choices and selected options
        choices = [...state.choices];
        selectedOptionA = state.selectedOptionA;
        selectedOptionB = state.selectedOptionB;

        // Restore choice inputs
        if (state.formData.choiceInputs.length > 0) {
            // Add enough choice inputs
            while (document.querySelectorAll('.choice').length < state.formData.choiceInputs.length) {
                addChoice();
            }
            // Remove excess inputs
            while (document.querySelectorAll('.choice').length > state.formData.choiceInputs.length) {
                const choiceInputs = document.querySelectorAll('.choice-input');
                if (choiceInputs.length > 1) {
                    choiceInputs[choiceInputs.length - 1].remove();
                }
            }

            // Fill choice inputs
            const choiceInputs = document.querySelectorAll('.choice');
            state.formData.choiceInputs.forEach((value, index) => {
                if (choiceInputs[index]) {
                    choiceInputs[index].value = value;
                }
            });
            updateChoices();
        }

        // Restore comparison textareas
        if (document.getElementById('advantages-a')) document.getElementById('advantages-a').value = state.formData.advantagesA;
        if (document.getElementById('disadvantages-a')) document.getElementById('disadvantages-a').value = state.formData.disadvantagesA;
        if (document.getElementById('advantages-b')) document.getElementById('advantages-b').value = state.formData.advantagesB;
        if (document.getElementById('disadvantages-b')) document.getElementById('disadvantages-b').value = state.formData.disadvantagesB;

        // Restore stepper values
        if (state.formData.stepperValues) {
            Object.entries(state.formData.stepperValues).forEach(([stepperId, value]) => {
                const stepper = document.getElementById(stepperId);
                if (stepper) {
                    stepper.value = value;
                }
            });
            
            // Re-initialize steppers to update totals
            initializeSteppers();
        }

        // Update section-specific elements
        if (selectedOptionA && selectedOptionB) {
            // Update option titles if in comparison/scoring/results
            const optionATitle = document.getElementById('option-a-title');
            const optionBTitle = document.getElementById('option-b-title');
            if (optionATitle) optionATitle.textContent = selectedOptionA;
            if (optionBTitle) optionBTitle.textContent = selectedOptionB;
        }
    }

    function updateNavigationButtons() {
        const backBtn = document.getElementById('nav-back-btn');
        const forwardBtn = document.getElementById('nav-forward-btn');
        
        if (backBtn) {
            backBtn.disabled = !canGoBack();
            backBtn.style.opacity = canGoBack() ? '1' : '0.5';
        }
        
        if (forwardBtn) {
            forwardBtn.disabled = !canGoForward();
            forwardBtn.style.opacity = canGoForward() ? '1' : '0.5';
        }
    }

    function initializeNavigationHistory() {
        // Only initialize if history is empty (not restoring from saved data)
        if (navigationHistory.length === 0) {
            const initialState = captureCurrentState();
            navigationHistory.push({
                section: 'brainstorm',
                state: initialState,
                timestamp: Date.now()
            });
            currentHistoryIndex = 0;
        }
    }
});