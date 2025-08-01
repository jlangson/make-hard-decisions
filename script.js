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
    const universalStartOverBtn = document.getElementById('universal-start-over');
    const shareResultsBtn = document.getElementById('share-results');

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
        updateMetaTags();
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

        // Reset all sliders to 50/50
        const sliders = document.querySelectorAll('.comparison-slider');
        sliders.forEach(slider => {
            slider.value = 50;
        });

        // Initialize sliders and set up listeners
        initializeSliders();
        setupComparisonInputListeners();

        showSection(scoringSection);
    }

    // Slider functionality
    function setupComparisonInputListeners() {
        // Set up listeners for each slider
        const sliders = [
            ['slider-1-2', 'value-1', 'value-2'],
            ['slider-3-4', 'value-3', 'value-4'],
            ['slider-5-6', 'value-5', 'value-6'],
            ['slider-7-8', 'value-7', 'value-8']
        ];

        sliders.forEach(([sliderId, leftValueId, rightValueId]) => {
            const slider = document.getElementById(sliderId);
            const leftValue = document.getElementById(leftValueId);
            const rightValue = document.getElementById(rightValueId);

            if (slider && leftValue && rightValue) {
                slider.addEventListener('input', () => handleSliderChange(slider, leftValue, rightValue));
                // Update gradient background on change
                slider.addEventListener('input', () => updateSliderBackground(slider));
            }
        });
    }

    function handleSliderChange(slider, leftValue, rightValue) {
        const sliderValue = parseInt(slider.value);
        const leftPoints = sliderValue;
        const rightPoints = 100 - sliderValue;
        
        leftValue.textContent = leftPoints;
        rightValue.textContent = rightPoints;
    }

    function updateSliderBackground(slider) {
        const value = slider.value;
        const percentage = value;
        slider.style.background = `linear-gradient(to right, #2196f3 0%, #2196f3 ${percentage}%, #ff6b35 ${percentage}%, #ff6b35 100%)`;
    }

    function initializeSliders() {
        // Initialize all sliders with proper backgrounds
        const sliders = document.querySelectorAll('.comparison-slider');
        sliders.forEach(slider => {
            updateSliderBackground(slider);
        });
    }

    function calculateResult() {
        // Get values from sliders
        const slider12 = parseInt(document.getElementById('slider-1-2').value) || 50;
        const slider34 = parseInt(document.getElementById('slider-3-4').value) || 50;
        const slider56 = parseInt(document.getElementById('slider-5-6').value) || 50;
        const slider78 = parseInt(document.getElementById('slider-7-8').value) || 50;

        // Convert slider values to circle values
        const circle1 = slider12;        // Advantages A internal
        const circle2 = 100 - slider12;  // Disadvantages A internal
        const circle3 = slider34;        // Advantages B internal
        const circle4 = 100 - slider34;  // Disadvantages B internal
        const circle5 = slider56;        // Advantages A vs B
        const circle6 = 100 - slider56;  // Advantages B vs A
        const circle7 = slider78;        // Disadvantages A vs B
        const circle8 = 100 - slider78;  // Disadvantages B vs A

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

    function universalStartOver() {
        // Clear all form data first
        document.querySelectorAll('input, textarea').forEach(element => {
            element.value = '';
        });
        
        // Force hard reload
        window.location.href = window.location.href;
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
});