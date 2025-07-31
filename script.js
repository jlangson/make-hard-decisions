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
        setupSliders();
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
    }

    function setupSliders() {
        const sliders = document.querySelectorAll('input[type="range"]');
        sliders.forEach(slider => {
            const display = slider.nextElementSibling;
            slider.addEventListener('input', function() {
                display.textContent = this.value;
            });
        });
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

        // Update option names in scoring section
        document.getElementById('score-option-a-1').textContent = selectedOptionA;
        document.getElementById('score-option-a-2').textContent = selectedOptionA;
        document.getElementById('score-option-b-1').textContent = selectedOptionB;
        document.getElementById('score-option-b-2').textContent = selectedOptionB;

        // Reset all sliders to 5
        const sliders = document.querySelectorAll('#scoring-section input[type="range"]');
        sliders.forEach(slider => {
            slider.value = 5;
            slider.nextElementSibling.textContent = 5;
        });

        showSection(scoringSection);
    }

    function calculateResult() {
        // Get scores
        const advantagesAScore = parseInt(document.getElementById('advantages-a-score').value);
        const disadvantagesAScore = parseInt(document.getElementById('disadvantages-a-score').value);
        const advantagesBScore = parseInt(document.getElementById('advantages-b-score').value);
        const disadvantagesBScore = parseInt(document.getElementById('disadvantages-b-score').value);

        // Calculate net scores (advantages - disadvantages)
        const netScoreA = advantagesAScore - disadvantagesAScore;
        const netScoreB = advantagesBScore - disadvantagesBScore;

        // Get the text content for display
        const advantagesA = document.getElementById('advantages-a').value;
        const disadvantagesA = document.getElementById('disadvantages-a').value;
        const advantagesB = document.getElementById('advantages-b').value;
        const disadvantagesB = document.getElementById('disadvantages-b').value;

        // Generate results
        displayResults({
            optionA: selectedOptionA,
            optionB: selectedOptionB,
            scores: {
                advantagesA: advantagesAScore,
                disadvantagesA: disadvantagesAScore,
                advantagesB: advantagesBScore,
                disadvantagesB: disadvantagesBScore,
                netA: netScoreA,
                netB: netScoreB
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
        
        let winner, winnerScore, loser, loserScore;
        if (data.scores.netA > data.scores.netB) {
            winner = data.optionA;
            winnerScore = data.scores.netA;
            loser = data.optionB;
            loserScore = data.scores.netB;
        } else if (data.scores.netB > data.scores.netA) {
            winner = data.optionB;
            winnerScore = data.scores.netB;
            loser = data.optionA;
            loserScore = data.scores.netA;
        } else {
            winner = null; // It's a tie
        }

        let resultsHTML = `
            <div class="result-item ${winner === data.optionA ? 'winner' : ''}">
                <h3>${data.optionA}</h3>
                <p><strong>Advantages Score:</strong> ${data.scores.advantagesA}/10</p>
                <p><strong>Disadvantages Impact:</strong> ${data.scores.disadvantagesA}/10</p>
                <p><strong>Net Score:</strong> ${data.scores.netA}</p>
            </div>
            
            <div class="result-item ${winner === data.optionB ? 'winner' : ''}">
                <h3>${data.optionB}</h3>
                <p><strong>Advantages Score:</strong> ${data.scores.advantagesB}/10</p>
                <p><strong>Disadvantages Impact:</strong> ${data.scores.disadvantagesBScore}/10</p>
                <p><strong>Net Score:</strong> ${data.scores.netB}</p>
            </div>
            
            <div class="result-item" style="text-align: center; background: #e6fffa; border-left-color: #319795;">
                <h3>Recommendation</h3>
        `;

        if (winner) {
            const scoreDifference = Math.abs(winnerScore - loserScore);
            let confidence = '';
            if (scoreDifference >= 6) confidence = 'Strong recommendation';
            else if (scoreDifference >= 3) confidence = 'Moderate recommendation';
            else confidence = 'Slight preference';

            resultsHTML += `
                <p><strong>${confidence}:</strong> ${winner}</p>
                <p>Net score advantage: ${scoreDifference} points</p>
            `;
        } else {
            resultsHTML += `
                <p><strong>It's a tie!</strong></p>
                <p>Both options have the same net score. Consider other factors not captured in this analysis.</p>
            `;
        }

        resultsHTML += `
            </div>
            
            <details style="margin-top: 20px;">
                <summary style="cursor: pointer; font-weight: bold; padding: 10px; background: #f7fafc; border-radius: 5px;">
                    View Analysis Details
                </summary>
                <div style="padding: 15px; background: #f7fafc; margin-top: 10px; border-radius: 5px;">
                    <h4>${data.optionA} - Advantages (${data.scores.advantagesA}/10):</h4>
                    <p style="margin-bottom: 15px;">${data.content.advantagesA || 'No advantages listed'}</p>
                    
                    <h4>${data.optionA} - Disadvantages (${data.scores.disadvantagesA}/10):</h4>
                    <p style="margin-bottom: 15px;">${data.content.disadvantagesA || 'No disadvantages listed'}</p>
                    
                    <h4>${data.optionB} - Advantages (${data.scores.advantagesB}/10):</h4>
                    <p style="margin-bottom: 15px;">${data.content.advantagesB || 'No advantages listed'}</p>
                    
                    <h4>${data.optionB} - Disadvantages (${data.scores.disadvantagesB}/10):</h4>
                    <p>${data.content.disadvantagesB || 'No disadvantages listed'}</p>
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