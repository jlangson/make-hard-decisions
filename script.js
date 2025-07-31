document.addEventListener('DOMContentLoaded', function() {
    let choices = [];
    let selectedOptionA = '';
    let selectedOptionB = '';

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

    // Sections
    const brainstormSection = document.getElementById('brainstorm-section');
    const selectionSection = document.getElementById('selection-section');
    const comparisonSection = document.getElementById('comparison-section');
    const scoringSection = document.getElementById('scoring-section');
    const resultsSection = document.getElementById('results-section');

    // Initialize the app
    init();

    function init() {
        updateChoices();
        setupEventListeners();
    }

    function setupEventListeners() {
        addChoiceBtn.addEventListener('click', addChoice);
        proceedToComparisonBtn.addEventListener('click', proceedToComparison);
        startComparisonBtn.addEventListener('click', startComparison);
        proceedToScoringBtn.addEventListener('click', proceedToScoring);
        calculateResultBtn.addEventListener('click', calculateResult);
        startOverBtn.addEventListener('click', startOver);

        // Handle dynamic choice input changes
        choicesContainer.addEventListener('input', handleChoiceInput);
        choicesContainer.addEventListener('click', handleRemoveChoice);
        choicesContainer.addEventListener('keydown', handleChoiceKeydown);
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
        }
    }

    function handleRemoveChoice(event) {
        if (event.target.classList.contains('remove-choice')) {
            const choiceInputs = document.querySelectorAll('.choice-input');
            if (choiceInputs.length > 1) {
                event.target.parentElement.remove();
                updateChoices();
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
            return;
        }

        populateSelectors();
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

        // Reset all comparison inputs to 50/50
        const comparisonInputs = document.querySelectorAll('.comparison-number');
        comparisonInputs.forEach(input => {
            input.value = 50;
        });

        // Update all totals
        updateTotalDisplays();
        setupComparisonInputListeners();

        showSection(scoringSection);
    }

    // Auto-balancing input functionality
    function setupComparisonInputListeners() {
        // Set up listeners for each pair of inputs
        const pairs = [
            ['circle-1', 'circle-2', 'total-1-2'],
            ['circle-3', 'circle-4', 'total-3-4'],
            ['circle-5', 'circle-6', 'total-5-6'],
            ['circle-7', 'circle-8', 'total-7-8']
        ];

        pairs.forEach(([input1Id, input2Id, totalId]) => {
            const input1 = document.getElementById(input1Id);
            const input2 = document.getElementById(input2Id);
            const totalDisplay = document.getElementById(totalId);

            input1.addEventListener('input', () => handleBalancedInput(input1, input2, totalDisplay));
            input2.addEventListener('input', () => handleBalancedInput(input2, input1, totalDisplay));
        });
    }

    function handleBalancedInput(changedInput, otherInput, totalDisplay) {
        const changedValue = parseInt(changedInput.value) || 0;
        const otherValue = 100 - changedValue;
        
        // Ensure values are within bounds
        if (changedValue < 0) {
            changedInput.value = 0;
            otherInput.value = 100;
        } else if (changedValue > 100) {
            changedInput.value = 100;
            otherInput.value = 0;
        } else {
            otherInput.value = otherValue;
        }

        updateTotalDisplay(totalDisplay, parseInt(changedInput.value), parseInt(otherInput.value));
    }

    function updateTotalDisplay(totalDisplay, value1, value2) {
        const total = value1 + value2;
        totalDisplay.textContent = total;
        
        // Add visual feedback for invalid totals
        if (total !== 100) {
            totalDisplay.classList.add('invalid');
        } else {
            totalDisplay.classList.remove('invalid');
        }
    }

    function updateTotalDisplays() {
        const pairs = [
            ['circle-1', 'circle-2', 'total-1-2'],
            ['circle-3', 'circle-4', 'total-3-4'],
            ['circle-5', 'circle-6', 'total-5-6'],
            ['circle-7', 'circle-8', 'total-7-8']
        ];

        pairs.forEach(([input1Id, input2Id, totalId]) => {
            const input1 = document.getElementById(input1Id);
            const input2 = document.getElementById(input2Id);
            const totalDisplay = document.getElementById(totalId);
            
            updateTotalDisplay(totalDisplay, parseInt(input1.value), parseInt(input2.value));
        });
    }

    function calculateResult() {
        // Get all circle values
        const circle1 = parseInt(document.getElementById('circle-1').value) || 0; // Advantages A internal
        const circle2 = parseInt(document.getElementById('circle-2').value) || 0; // Disadvantages A internal
        const circle3 = parseInt(document.getElementById('circle-3').value) || 0; // Advantages B internal
        const circle4 = parseInt(document.getElementById('circle-4').value) || 0; // Disadvantages B internal
        const circle5 = parseInt(document.getElementById('circle-5').value) || 0; // Advantages A vs B
        const circle6 = parseInt(document.getElementById('circle-6').value) || 0; // Advantages B vs A
        const circle7 = parseInt(document.getElementById('circle-7').value) || 0; // Disadvantages A vs B
        const circle8 = parseInt(document.getElementById('circle-8').value) || 0; // Disadvantages B vs A

        // Validate that all pairs total 100
        const totals = [
            circle1 + circle2,
            circle3 + circle4,
            circle5 + circle6,
            circle7 + circle8
        ];

        const allValid = totals.every(total => total === 100);
        if (!allValid) {
            alert('Please ensure all comparisons total exactly 100 points before calculating results.');
            return;
        }

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
                ${winner ? `<p><strong>Recommended Choice:</strong> ${winner}</p>` : '<p><strong>Decision is too close to call</strong></p>'}
            </div>

            <div class="result-item ${winner === data.optionA ? 'winner' : ''}">
                <h3>${data.optionA}</h3>
                <p><strong>Total Points:</strong> ${optionAScore} (Range: -200 to +200)</p>
                <p><strong>Advantages Total:</strong> ${circles.circle9} points</p>
                <p><strong>Disadvantages Total:</strong> ${circles.circle10} points</p>
                <div style="margin-top: 10px; font-size: 0.9rem; color: #666;">
                    <p>Internal: ${circles.circle1} adv, ${circles.circle2} dis</p>
                    <p>vs ${data.optionB}: ${circles.circle5} adv, ${circles.circle7} dis</p>
                </div>
            </div>
            
            <div class="result-item ${winner === data.optionB ? 'winner' : ''}">
                <h3>${data.optionB}</h3>
                <p><strong>Total Points:</strong> ${optionBScore} (Range: -200 to +200)</p>
                <p><strong>Advantages Total:</strong> ${circles.circle11} points</p>
                <p><strong>Disadvantages Total:</strong> ${circles.circle12} points</p>
                <div style="margin-top: 10px; font-size: 0.9rem; color: #666;">
                    <p>Internal: ${circles.circle3} adv, ${circles.circle4} dis</p>
                    <p>vs ${data.optionA}: ${circles.circle6} adv, ${circles.circle8} dis</p>
                </div>
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

    function showSection(targetSection) {
        // Hide all sections
        [brainstormSection, selectionSection, comparisonSection, scoringSection, resultsSection]
            .forEach(section => section.classList.add('hidden'));
        
        // Show target section
        targetSection.classList.remove('hidden');
        
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
});