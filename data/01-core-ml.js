PREP.push({
id:"core-ml", n:"01", title:"Core ML & Statistics", icon:"Σ",
blurb:"The fundamentals every loop tests first. Classification, metrics, feature engineering, ensembles, optimization, and the statistics that separate a data scientist from a model-fitter.",
topics:[
{
title:"Supervised learning foundations",
items:[
{q:"Classification vs regression — and the follow-up that actually matters",
roles:["ds","aie"],lvl:"core",tags:["basics"],
a:`<p><strong>Classification</strong> predicts a discrete label; <strong>regression</strong> predicts a continuous quantity.</p>
<ul>
<li>Classification: spam/not-spam, fraud/legit, churn/retain. Metrics: precision, recall, F1, ROC-AUC, PR-AUC, log loss.</li>
<li>Regression: house price, revenue, demand. Metrics: RMSE, MAE, MAPE, R².</li>
</ul>
<p>The real follow-up is <em>"how would you decide which framing to use?"</em> Many problems can be either. Predicting "days until churn" is regression; predicting "churn in next 30 days" is classification.</p>
<div class="say"><b>Say this:</b> "I pick the framing that matches the decision the business will make. If the action is a binary intervention — send a retention offer or don't — I frame it as classification and tune the threshold against the cost of a wasted offer versus a lost customer. If the action depends on <em>when</em>, I model time-to-event with survival analysis instead, because a plain classifier throws away the censoring information."</div>
<div class="trap"><b>Trap:</b> Saying "ordinal targets are just regression." Ordinal targets (1–5 star ratings) have order but not meaningful distances. Use ordinal regression or treat as classification with an ordinal-aware loss; plain regression will happily predict 3.7 stars and plain classification will treat 1 and 5 as equally wrong when the truth is 2.</div>`},

{q:"Why is logistic regression called 'regression' if it classifies?",
roles:["ds","aie"],lvl:"core",tags:["basics","glm"],
a:`<p>Because it <em>regresses</em> the log-odds of the outcome on a linear function of the features. The model is linear — in log-odds space.</p>
<pre><code>logit(p) = log( p / (1-p) ) = wᵀx + b

p = σ(wᵀx + b) = 1 / (1 + e^-(wᵀx + b))</code></pre>
<p>The output is a <strong>probability</strong>. Classification only happens when you apply a threshold, which is a separate business decision, not part of the model.</p>
<ul>
<li>It is a <strong>Generalized Linear Model</strong> with a Bernoulli likelihood and a logit link.</li>
<li>Coefficients are interpretable: <code>e^w_j</code> is the multiplicative change in odds per unit increase in feature <em>j</em>.</li>
<li>Fit by maximum likelihood (minimizing binary cross-entropy), not by least squares — there is no closed form, so it uses iterative solvers (IRLS, L-BFGS, SGD).</li>
</ul>
<div class="say"><b>Say this:</b> "It's a regression on the log-odds. It outputs a calibrated-ish probability, and the 0.5 threshold people assume is just a default — I almost always move it based on the precision/recall economics of the problem."</div>`},

{q:"State all assumptions of linear regression and how you'd check each one",
roles:["ds"],lvl:"core",tags:["stats","glm","high-freq"],
a:`<p>Five, and interviewers want the <em>diagnostic</em> for each — not just the name.</p>
<table><thead><tr><th>Assumption</th><th>What it says</th><th>How to check</th><th>Fix</th></tr></thead><tbody>
<tr><td>Linearity</td><td>E[Y|X] is linear in the parameters</td><td>Residuals vs fitted plot (should be structureless); partial residual plots</td><td>Add polynomial/spline terms, log-transform, or switch to a tree model</td></tr>
<tr><td>Independence of errors</td><td>Residuals are not correlated with each other</td><td>Durbin–Watson statistic; ACF plot of residuals</td><td>Time-series models (ARIMA), mixed effects, cluster-robust SEs</td></tr>
<tr><td>Homoscedasticity</td><td>Residual variance is constant across fitted values</td><td>Residuals vs fitted (look for a funnel/cone); Breusch–Pagan test</td><td>Log/Box-Cox transform the target, weighted least squares, or robust (Huber–White) standard errors</td></tr>
<tr><td>Normality of <em>residuals</em></td><td>Errors ~ N(0, σ²)</td><td>Q–Q plot of residuals; Shapiro–Wilk (careful: over-powered on large n)</td><td>Transform target; or rely on CLT for large n — point estimates stay unbiased regardless</td></tr>
<tr><td>No multicollinearity</td><td>Features are not near-linear combinations of each other</td><td>VIF (&gt;5 suspicious, &gt;10 serious); correlation matrix; condition number</td><td>Drop/combine features, PCA, ridge regression</td></tr>
</tbody></table>
<div class="trap"><b>Trap they will set:</b> "Do your features need to be normally distributed?" <strong>No.</strong> Nothing in OLS requires normal features or a normal target. Only the <em>residuals</em> need approximate normality, and only for exact small-sample inference (t-tests, F-tests, confidence intervals). Coefficient estimates are unbiased and BLUE under Gauss–Markov without any normality assumption at all.</div>
<div class="say"><b>Say this:</b> "Linearity, independent errors, constant error variance, approximately normal residuals, and no severe multicollinearity. The normality one is about residuals, not features, and it only matters for the p-values and confidence intervals — with a large sample the CLT covers me. Multicollinearity doesn't bias predictions, it just makes individual coefficients unstable and uninterpretable, which matters a lot if the model is being used to explain rather than predict."</div>`},

{q:"What is a normal / Gaussian distribution, and why does it matter in ML?",
roles:["ds"],lvl:"core",tags:["stats"],
a:`<p>"Normal" and "Gaussian" are the same distribution — a symmetric bell curve fully described by its mean and variance.</p>
<pre><code>f(x) = 1/(σ√(2π)) · exp( -(x-μ)² / (2σ²) )</code></pre>
<ul>
<li>Mean = median = mode; symmetric; unbounded support.</li>
<li><strong>68–95–99.7 rule:</strong> that share of the mass lies within 1σ, 2σ, 3σ of the mean.</li>
<li>Fully specified by two parameters, which is why so much classical inference is built on it.</li>
</ul>
<p><strong>Where it actually matters:</strong></p>
<ul>
<li><strong>Inference, not fitting.</strong> t-tests, F-tests, p-values and confidence intervals are derived under normality of the error term.</li>
<li><strong>Central Limit Theorem.</strong> The <em>sampling distribution of the mean</em> tends to normal as n grows regardless of the population shape — this is why A/B tests work on non-normal metrics.</li>
<li><strong>Algorithms that assume it:</strong> Gaussian Naive Bayes, LDA/QDA, GMMs, Kalman filters, and the Gaussian likelihood that makes MSE the "right" loss.</li>
<li><strong>Z-scores and anomaly detection.</strong> A 3σ rule only means anything if the distribution is roughly normal.</li>
</ul>
<div class="trap"><b>Trap:</b> Assuming heavy-tailed business data is normal. Revenue, session length, and claim sizes are usually log-normal or power-law. A 3σ outlier rule on log-normal revenue will flag your best customers as errors.</div>`},

{q:"How do you calculate variance, and why n−1 for a sample?",
roles:["ds"],lvl:"core",tags:["stats"],
a:`<p>Variance measures average squared deviation from the mean.</p>
<pre><code>Population:  σ² = (1/N) Σ (xᵢ - μ)²
Sample:      s² = (1/(n-1)) Σ (xᵢ - x̄)²</code></pre>
<p><strong>Worked example on [2, 4, 6, 8]:</strong></p>
<ol>
<li>Mean = 20/4 = <strong>5</strong></li>
<li>Deviations = [−3, −1, 1, 3]</li>
<li>Squared = [9, 1, 1, 9], sum = <strong>20</strong></li>
<li>Population variance = 20/4 = <strong>5</strong>. Sample variance = 20/3 ≈ <strong>6.67</strong></li>
</ol>
<p><strong>Why n−1 (Bessel's correction):</strong> you estimated the mean from the same data, so deviations are measured from x̄ rather than the true μ. x̄ is by construction the value that <em>minimizes</em> the sum of squared deviations, so dividing by n systematically underestimates the true variance. You spent one degree of freedom estimating the mean; n−1 corrects for it and makes s² an unbiased estimator of σ².</p>
<div class="say"><b>Say this:</b> "Average squared deviation from the mean. Divide by n−1 for a sample because estimating the mean from the same data eats a degree of freedom and biases the estimate downward. Standard deviation is the square root, which puts it back in the original units — that's why I report σ, not σ², to stakeholders."</div>`},

{q:"Explain the bias–variance tradeoff, and decompose the error",
roles:["ds","aie"],lvl:"core",tags:["basics","high-freq"],
a:`<p>Expected squared error at a point decomposes into three terms:</p>
<pre><code>E[(y - f̂(x))²] = Bias[f̂(x)]² + Var[f̂(x)] + σ²_irreducible</code></pre>
<ul>
<li><strong>Bias</strong> — error from wrong assumptions; the model is too simple to represent the truth. High bias = <strong>underfitting</strong>.</li>
<li><strong>Variance</strong> — sensitivity to the particular training sample; the model changes a lot if you resample. High variance = <strong>overfitting</strong>.</li>
<li><strong>Irreducible noise</strong> — the Bayes error. No model beats this. Saying this out loud signals maturity.</li>
</ul>
<table><thead><tr><th></th><th>High bias</th><th>High variance</th></tr></thead><tbody>
<tr><td>Train error</td><td>High</td><td>Low</td></tr>
<tr><td>Val error</td><td>High (close to train)</td><td>High (big gap from train)</td></tr>
<tr><td>More data helps?</td><td>No</td><td>Yes</td></tr>
<tr><td>Fix</td><td>More capacity, better features, longer training, weaker regularization</td><td>Regularization, more data, simpler model, bagging, early stopping, dropout</td></tr>
</tbody></table>
<p><strong>Senior nuance:</strong> the classic U-shaped curve is not the whole story. Heavily over-parameterized models (large neural nets) show <strong>double descent</strong> — test error rises, then falls again past the interpolation threshold. Modern deep learning operates in that second regime, which is why "a model with more parameters than data points will overfit" is no longer a reliable rule.</p>
<div class="say"><b>Say this:</b> "I diagnose it from the learning curve, not from theory. If train and validation error are both high and converged, I'm bias-limited and more data won't help — I need capacity or better features. If there's a large and stable gap, I'm variance-limited and regularization or more data will help. And I always set an irreducible-error expectation first, so I know when to stop."</div>`},

{q:"How do you detect overfitting, and what do you do about it?",
roles:["ds","aie"],lvl:"core",tags:["basics","high-freq"],
a:`<p><strong>Detection:</strong></p>
<ul>
<li>Large train/validation gap (train 98%, val 75%).</li>
<li>Validation loss starts rising while training loss keeps falling.</li>
<li>Learning curves that diverge and never converge as data grows.</li>
<li>Cross-validation scores with high variance across folds.</li>
<li>Performance collapses on a truly out-of-time holdout (the honest test).</li>
</ul>
<p><strong>Fixes, in the order I'd actually try them:</strong></p>
<ol>
<li><strong>Check for leakage first.</strong> Suspiciously good training performance is more often leakage than overfitting. Target encoded without fold isolation, a feature computed after the prediction moment, duplicate rows across the split.</li>
<li>More/better data, including augmentation.</li>
<li>Regularization — L1/L2, dropout, weight decay, early stopping.</li>
<li>Reduce capacity — fewer trees or shallower depth, smaller hidden dims, feature selection.</li>
<li>Ensembling/bagging to average away variance.</li>
<li>Cross-validation for honest model selection, so you stop tuning against a single split.</li>
</ol>
<div class="trap"><b>Trap:</b> Overfitting the <em>validation</em> set. If you've tuned 200 hyperparameter configs against one validation split, that split is now part of training. Use nested CV or hold a final untouched test set.</div>`},

{q:"L1 vs L2 regularization — mechanism, not just the formula",
roles:["ds","aie"],lvl:"core",tags:["basics","high-freq"],
a:`<pre><code>L1 (Lasso):  Loss + λ Σ |wⱼ|
L2 (Ridge):  Loss + λ Σ wⱼ²
Elastic Net: Loss + λ( α Σ|wⱼ| + (1-α) Σ wⱼ² )</code></pre>
<table><thead><tr><th></th><th>L1 / Lasso</th><th>L2 / Ridge</th></tr></thead><tbody>
<tr><td>Effect on weights</td><td>Drives some to exactly <strong>0</strong></td><td>Shrinks all toward 0, none reach it</td></tr>
<tr><td>Use for</td><td>Feature selection, sparse models, interpretability</td><td>Correlated features, stability, general shrinkage</td></tr>
<tr><td>Geometry</td><td>Diamond constraint region — corners on the axes, so the optimum lands on an axis</td><td>Circular region — no corners, so it touches off-axis</td></tr>
<tr><td>Differentiable at 0?</td><td>No → needs subgradient / proximal methods</td><td>Yes → plain gradient descent works</td></tr>
<tr><td>Bayesian view</td><td>Laplace prior on weights</td><td>Gaussian prior on weights</td></tr>
<tr><td>Correlated features</td><td>Picks one arbitrarily, zeroes the rest (unstable)</td><td>Spreads weight across them (stable)</td></tr>
</tbody></table>
<div class="say"><b>Say this:</b> "L1 penalizes absolute magnitude, so its constraint region has corners on the axes and the optimum often lands exactly on one — that's why it zeroes coefficients and acts as feature selection. L2 penalizes squared magnitude, so the region is smooth and everything shrinks but nothing vanishes, which is better when features are correlated. If I have both problems — high dimensionality and correlated groups — I use Elastic Net."</div>
<div class="trap"><b>Trap:</b> Forgetting to scale features before regularizing. The penalty is on raw coefficient magnitude, so an unscaled feature measured in millions gets a tiny coefficient and is effectively exempt from the penalty.</div>`},

{q:"What is a subgradient, when do you need one, and how do you use it?",
roles:["ds","aie"],lvl:"senior",tags:["optimization","math"],
a:`<p>Gradient descent needs differentiability. Several loss functions we use every day are not differentiable everywhere.</p>
<p>A <strong>subgradient</strong> of a convex function <em>f</em> at <em>x</em> is any vector <em>g</em> such that <code>f(z) ≥ f(x) + gᵀ(z - x)</code> for all z — geometrically, any hyperplane that touches the function at x and stays below it everywhere. Where f is differentiable, the subgradient is unique and equals the gradient. At a kink there is a whole <strong>set</strong> of valid subgradients (the subdifferential ∂f).</p>
<p><strong>Where the kinks are:</strong></p>
<ul>
<li><strong>ReLU</strong>, <code>max(0,x)</code>: at x=0, ∂f(0) = [0, 1]. Frameworks pick 0 (PyTorch) — an arbitrary but valid choice.</li>
<li><strong>L1 penalty</strong>, <code>|w|</code>: at w=0, ∂f(0) = [−1, 1]. This is exactly what makes L1 produce exact zeros.</li>
<li><strong>Hinge loss</strong> in SVMs, <code>max(0, 1 − y·f(x))</code>: kinked at the margin.</li>
<li><strong>L1 loss / MAE</strong>: kinked at zero residual.</li>
</ul>
<p><strong>Use:</strong> the update looks identical, you just substitute a subgradient.</p>
<pre><code>w ← w − η · g,   where g ∈ ∂f(w)</code></pre>
<p><strong>Practical caveats a senior candidate adds:</strong> subgradient descent converges more slowly than gradient descent (O(1/√k) vs O(1/k) for smooth convex problems) and the loss is not monotonically decreasing, so you need a decaying step size. In practice for L1 you'd prefer <strong>proximal gradient / ISTA</strong> or coordinate descent, which handle the non-smooth term exactly via soft-thresholding rather than approximating it.</p>
<div class="say"><b>Say this:</b> "It generalizes the gradient to non-differentiable convex functions — at a kink, instead of one gradient you have a set of supporting slopes and you can use any of them. It's why ReLU, L1 and hinge loss are trainable at all. For L1 specifically I'd reach for proximal methods rather than raw subgradient descent, because soft-thresholding gives you exact sparsity instead of coefficients that hover near zero."</div>`}
]},

{
title:"Evaluation metrics",
items:[
{q:"Why isn't accuracy enough? Work the imbalanced example",
roles:["ds","aie"],lvl:"core",tags:["metrics","high-freq"],
a:`<p>1000 samples, 990 negative, 10 positive. A model that predicts "negative" for everything:</p>
<pre><code>Accuracy = 990/1000 = 99%
Recall   = 0/10     = 0%    ← it never finds a single positive</code></pre>
<p>99% accuracy, zero business value. Accuracy is dominated by the majority class and hides complete failure on the class you actually care about.</p>
<p><strong>Use instead:</strong> precision, recall, F1, PR-AUC (better than ROC-AUC under heavy imbalance), balanced accuracy, Matthews correlation coefficient, or better yet a cost-weighted metric built from the actual business costs of FP and FN.</p>
<div class="say"><b>Say this:</b> "Accuracy is only meaningful when the classes are balanced and FP and FN cost the same — which is almost never true in the problems worth solving. I start from the decision: what does a false positive cost us, what does a false negative cost us, and then I choose the metric that tracks that ratio."</div>`},

{q:"Precision, recall, F1 — formulas, intuition, and when each is the right target",
roles:["ds","aie"],lvl:"core",tags:["metrics","high-freq"],
a:`<pre><code>Precision = TP / (TP + FP)     "of what I flagged, how much was real?"
Recall    = TP / (TP + FN)     "of what was real, how much did I find?"
F1        = 2·P·R / (P + R)    harmonic mean
Fβ        = (1+β²)·P·R / (β²·P + R)   β>1 weights recall</code></pre>
<p><strong>Worked:</strong> flagged 100 as fraud, 80 were truly fraud → precision 0.80. There were 100 actual frauds, you caught 80 → recall 0.80.</p>
<table><thead><tr><th>Optimize</th><th>When</th><th>Because</th></tr></thead><tbody>
<tr><td><strong>Precision</strong></td><td>Spam filter, auto-blocking transactions, sending an expensive offer, auto-remediation</td><td>A false positive is visible and costly — you lose a real email, block a real customer, waste budget</td></tr>
<tr><td><strong>Recall</strong></td><td>Cancer screening, fraud triage, safety alerts, compliance detection</td><td>A missed positive is catastrophic; a false alarm just costs a review</td></tr>
<tr><td><strong>F1</strong></td><td>You need a single number and both errors matter comparably</td><td>Harmonic mean punishes lopsided models — 1.0 precision with 0.01 recall gives F1 ≈ 0.02</td></tr>
</tbody></table>
<p><strong>Why harmonic and not arithmetic mean?</strong> The arithmetic mean of P=1.0 and R=0.01 is 0.505 — flattering nonsense. The harmonic mean is 0.0198, which correctly says the model is useless.</p>
<div class="say"><b>Say this:</b> "Precision is about the cost of a false alarm, recall about the cost of a miss. I don't pick one abstractly — I ask what each error costs in the business and then set the threshold where expected cost is minimized. In fraud I usually run high recall with a human review queue, and I size the queue against the review team's actual capacity."</div>`},

{q:"ROC-AUC — what's on each axis, how do you read it, and what does the number mean?",
roles:["ds","aie"],lvl:"core",tags:["metrics","high-freq"],
a:`<pre><code>Y-axis: TPR (Recall, Sensitivity) = TP / (TP + FN)
X-axis: FPR (1 - Specificity)      = FP / (FP + TN)</code></pre>
<p>Each point on the curve is <strong>one decision threshold</strong>. Sweep the threshold from 1 to 0 and trace the curve: strict thresholds sit bottom-left (few flags, few false alarms), loose thresholds top-right (flag everything).</p>
<table><thead><tr><th>AUC</th><th>Reading</th></tr></thead><tbody>
<tr><td>1.0</td><td>Perfect separation — curve hugs the top-left corner</td></tr>
<tr><td>0.9–1.0</td><td>Excellent (in real business data, suspect leakage)</td></tr>
<tr><td>0.8–0.9</td><td>Good</td></tr>
<tr><td>0.7–0.8</td><td>Fair</td></tr>
<tr><td>0.5</td><td>Random — the diagonal</td></tr>
<tr><td>&lt;0.5</td><td>Worse than random; invert your predictions and you have a useful model</td></tr>
</tbody></table>
<p><strong>The probabilistic interpretation — memorize this sentence:</strong> AUC is the probability that the model assigns a higher score to a randomly chosen positive than to a randomly chosen negative. It is a measure of <em>ranking quality</em>, and it is threshold-independent.</p>
<p><strong>Worked micro-example.</strong> 5 samples. Labels [1, 1, 0, 1, 0] with scores [0.9, 0.7, 0.6, 0.35, 0.3] — so 3 positives (0.9, 0.7, 0.35) and 2 negatives (0.6, 0.3). Sweep the threshold:</p>
<table><thead><tr><th>Thresh</th><th>TP</th><th>FP</th><th>FN</th><th>TN</th><th>TPR</th><th>FPR</th></tr></thead><tbody>
<tr><td>0.90</td><td>1</td><td>0</td><td>2</td><td>2</td><td>0.33</td><td>0.0</td></tr>
<tr><td>0.70</td><td>2</td><td>0</td><td>1</td><td>2</td><td>0.67</td><td>0.0</td></tr>
<tr><td>0.60</td><td>2</td><td>1</td><td>1</td><td>1</td><td>0.67</td><td>0.5</td></tr>
<tr><td>0.35</td><td>3</td><td>1</td><td>0</td><td>1</td><td>1.00</td><td>0.5</td></tr>
<tr><td>0.30</td><td>3</td><td>2</td><td>0</td><td>0</td><td>1.00</td><td>1.0</td></tr>
</tbody></table>
<p>Area = (0.5 × 0.67) + (0.5 × 1.00) = <strong>0.835</strong>.</p>
<p><strong>Verify it the fast way</strong> — count concordant pairs, which is quicker under interview pressure than integrating the curve. 3 positives × 2 negatives = 6 pairs; the positive scores higher in 5 of them (only 0.35 &lt; 0.6 fails). <strong>5/6 ≈ 0.83.</strong> Same answer, and it's the probabilistic definition applied directly.</p>
<div class="trap"><b>Senior trap — ROC-AUC under heavy imbalance.</b> With 0.1% positives, the FPR denominator (FP+TN) is huge, so thousands of false positives barely move FPR and the ROC curve looks great while precision is terrible. <strong>Use PR-AUC (average precision) instead</strong> — it uses precision, whose denominator is the flagged set, so it is sensitive to exactly the failure that matters. Say this unprompted; it is a strong senior signal.</div>`},

{q:"Confusion matrix, and every rate derived from it",
roles:["ds","aie"],lvl:"core",tags:["metrics"],
a:`<pre><code>                 Predicted +      Predicted -
Actual +            TP               FN   (Type II error, miss)
Actual -            FP               TN
                 (Type I error,
                  false alarm)</code></pre>
<table><thead><tr><th>Metric</th><th>Formula</th><th>Also called</th></tr></thead><tbody>
<tr><td>Accuracy</td><td>(TP+TN)/(TP+TN+FP+FN)</td><td>—</td></tr>
<tr><td>Precision</td><td>TP/(TP+FP)</td><td>PPV</td></tr>
<tr><td>Recall</td><td>TP/(TP+FN)</td><td>Sensitivity, TPR, hit rate</td></tr>
<tr><td>Specificity</td><td>TN/(TN+FP)</td><td>TNR, selectivity</td></tr>
<tr><td>FPR</td><td>FP/(FP+TN)</td><td>1 − specificity, fall-out</td></tr>
<tr><td>FNR</td><td>FN/(FN+TP)</td><td>1 − recall, miss rate</td></tr>
<tr><td>NPV</td><td>TN/(TN+FN)</td><td>Negative predictive value</td></tr>
<tr><td>Balanced accuracy</td><td>(TPR+TNR)/2</td><td>—</td></tr>
<tr><td>MCC</td><td>(TP·TN − FP·FN) / √((TP+FP)(TP+FN)(TN+FP)(TN+FN))</td><td>Phi coefficient — best single metric for imbalanced binary</td></tr>
</tbody></table>
<p>Expect a numerical drill: they give you the four counts and ask for precision, recall and F1 out loud. Practice it until it's automatic.</p>`},

{q:"Model calibration — what it is and why seniors get asked about it",
roles:["ds","aie"],lvl:"senior",tags:["metrics","senior-signal"],
a:`<p>A model is <strong>calibrated</strong> if, among all cases it scores 0.7, roughly 70% are actually positive. Discrimination (AUC) and calibration are independent properties: a model can rank perfectly and still have wildly wrong probabilities.</p>
<p><strong>Why it matters:</strong> the moment a downstream system multiplies your score by a monetary value — expected loss, expected revenue, bid price, expected lifetime value — you need calibrated probabilities, not just good ranking. "0.9 means 90%" has to be true.</p>
<p><strong>Diagnose:</strong> reliability diagram (predicted probability bucket vs observed frequency), Expected Calibration Error (ECE), Brier score (<code>mean((p - y)²)</code>, which decomposes into calibration + refinement).</p>
<p><strong>Common miscalibration sources:</strong></p>
<ul>
<li>Class rebalancing (SMOTE, undersampling, class weights) — shifts the base rate, so probabilities no longer reflect reality. You must correct the intercept afterwards.</li>
<li>Tree ensembles and boosting push scores toward the extremes.</li>
<li>Modern deep nets are systematically overconfident.</li>
<li>SVMs produce distances, not probabilities, at all.</li>
</ul>
<p><strong>Fixes:</strong> Platt scaling (fit a logistic regression on the scores), isotonic regression (non-parametric, needs more data), temperature scaling for neural nets (a single learned scalar dividing the logits — cheap and effective). Always fit the calibrator on a <em>held-out</em> calibration set, never on training data.</p>
<div class="say"><b>Say this:</b> "AUC tells me the ranking is good; calibration tells me the number means what it says. As soon as a business rule multiplies my score by a dollar value, I need calibration, so I check a reliability curve and ECE, and if I've rebalanced the classes I correct the intercept because rebalancing always breaks calibration."</div>`},

{q:"Cross-validation: k-fold, stratified, time-series, nested — and when each is wrong",
roles:["ds"],lvl:"core",tags:["validation","high-freq"],
a:`<p><strong>k-fold:</strong> split into k folds, train on k−1, validate on the held-out fold, repeat k times, average. Typical k=5 or 10. Gives a lower-variance performance estimate and uses all data for both training and validation.</p>
<ul>
<li><strong>Stratified k-fold</strong> — preserves class proportions in each fold. Default for classification, essential under imbalance.</li>
<li><strong>Group k-fold</strong> — keeps all rows of an entity (a user, a patient, a document) in the same fold. Skip this and you leak: the model memorizes the user, not the pattern.</li>
<li><strong>Time-series split / walk-forward</strong> — always train on the past, validate on the future, with an optional gap (purge/embargo) to prevent look-ahead through lagged features. <strong>Never use random k-fold on temporal data.</strong></li>
<li><strong>Nested CV</strong> — inner loop tunes hyperparameters, outer loop estimates generalization. The honest way to report performance when you have also done model selection.</li>
<li><strong>LOOCV</strong> — k=n. Nearly unbiased but high variance and expensive; only for tiny datasets.</li>
<li><strong>Repeated stratified k-fold</strong> — multiple shuffled repeats, when your dataset is small and fold assignment matters.</li>
</ul>
<div class="trap"><b>Trap they love:</b> "Where do you fit the scaler / imputer / target encoder?" <strong>Inside the CV loop, on the training fold only</strong>, then apply to the validation fold. Fitting a scaler on the whole dataset before splitting leaks test-set statistics into training and inflates your score. Use a <code>Pipeline</code> so this is structurally impossible.</div>
<div class="say"><b>Say this:</b> "k-fold for the variance reduction, stratified for classification, grouped whenever rows share an entity, and walk-forward with a purge gap for anything temporal. Every transform that learns parameters goes inside a pipeline fitted per fold — the classic leak is a scaler or target encoder fitted on the full dataset before the split."</div>`},

{q:"Train / validation / test — what each is for, and the split that actually matters",
roles:["ds","aie"],lvl:"core",tags:["validation"],
a:`<table><thead><tr><th>Set</th><th>Purpose</th><th>Touched how often</th></tr></thead><tbody>
<tr><td>Train (60–80%)</td><td>Learn parameters</td><td>Constantly</td></tr>
<tr><td>Validation (10–20%)</td><td>Tune hyperparameters, select architecture, early stopping</td><td>Many times — and it degrades with each use</td></tr>
<tr><td>Test (10–20%)</td><td>Final unbiased estimate</td><td><strong>Once</strong>, at the end</td></tr>
</tbody></table>
<p>Typical: 70/15/15 or 80/10/10. With CV you fold train+validation together and keep a separate test set.</p>
<p><strong>The split that actually matters in production ML</strong> is not random — it's <strong>out-of-time</strong>. Hold out the most recent period entirely. A random split on temporal data tells you how well you interpolate within a period you've already seen; an out-of-time split tells you whether the model will still work next month, which is the only question that matters once it's deployed.</p>
<div class="say"><b>Say this:</b> "Random split for the model-development loop, but I always add an out-of-time holdout as the gate for deployment, because the production question is 'does this still work next month' and a random split can't answer it."</div>`}
]},

{
title:"Feature engineering & data preparation",
items:[
{q:"What is feature engineering, and what's your actual process?",
roles:["ds"],lvl:"core",tags:["features","high-freq"],
a:`<p>Constructing input representations that make the learning problem easier — encoding domain knowledge the model can't discover on its own from the raw columns.</p>
<p><strong>Categories with examples:</strong></p>
<ul>
<li><strong>Derived</strong> — age from date-of-birth; debt-to-income from debt and income; BMI from height and weight.</li>
<li><strong>Temporal</strong> — recency (days since last purchase), frequency, trend, rolling windows (7/30/90-day means), lags, day-of-week and hour-of-day cyclically encoded as sin/cos, holiday flags.</li>
<li><strong>Aggregations</strong> — per-customer mean/max/std of transaction amounts; count of distinct merchants; ratio of last-7-day to last-90-day activity.</li>
<li><strong>Interactions</strong> — price × region; tenure × plan type. Linear models need these explicitly; trees find some automatically.</li>
<li><strong>Text</strong> — TF-IDF, embeddings, length, readability, entity counts.</li>
<li><strong>Domain ratios</strong> — usually the highest-value features and the ones a model can never invent. In telecom churn: complaints per month of tenure.</li>
</ul>
<div class="trap"><b>The #1 trap: point-in-time correctness.</b> Every feature must be computable using only information available <em>at prediction time</em>. "Total lifetime spend" computed over the full table leaks the future into a model predicting churn at month 6. This is the most common silent killer of real ML projects, and naming it unprompted is a strong signal.</div>
<div class="say"><b>Say this:</b> "I start from the business mechanism — what would a domain expert look at to make this call — and build recency/frequency/monetary and ratio features from that, because ratios and trends carry signal raw levels don't. Then I enforce point-in-time correctness with a feature store or explicit as-of joins, because the feature that looks most predictive in a notebook is usually the one that leaked."</div>`},

{q:"How do you handle missing values?",
roles:["ds"],lvl:"core",tags:["features","high-freq"],
a:`<p><strong>First: diagnose the mechanism,</strong> because it determines what's safe.</p>
<ul>
<li><strong>MCAR</strong> (missing completely at random) — missingness unrelated to anything. Safe to impute or drop.</li>
<li><strong>MAR</strong> (missing at random) — depends on observed features. Model-based imputation works.</li>
<li><strong>MNAR</strong> (missing not at random) — depends on the unobserved value itself. Income missing <em>because</em> it's high. Here missingness <strong>is signal</strong>: add an explicit indicator column.</li>
</ul>
<table><thead><tr><th>Type</th><th>Approach</th><th>Note</th></tr></thead><tbody>
<tr><td>Numerical</td><td>Median (robust to skew), mean, KNN, MICE / IterativeImputer</td><td>Median over mean for skewed data</td></tr>
<tr><td>Categorical</td><td>Mode, or an explicit <code>"Unknown"</code> level</td><td>"Unknown" often better — it preserves the information that it was missing</td></tr>
<tr><td>Time series</td><td>Forward fill, interpolation, seasonal naive</td><td>Never backfill — that's look-ahead leakage</td></tr>
<tr><td>Tree models</td><td>XGBoost/LightGBM/CatBoost learn a default direction per split</td><td>Often just pass NaN through; don't impute unnecessarily</td></tr>
</tbody></table>
<p><strong>Always add a binary <code>was_missing</code> indicator</strong> alongside the imputed value when missingness could be informative. It costs one column and frequently beats the imputation itself.</p>
<div class="trap"><b>Trap:</b> Imputing before splitting. Fit the imputer on the training fold only — a median computed over the whole dataset leaks test information.</div>`},

{q:"Encoding categorical variables — and when one-hot is the wrong choice",
roles:["ds"],lvl:"core",tags:["features","high-freq"],
a:`<table><thead><tr><th>Method</th><th>How</th><th>Use when</th><th>Risk</th></tr></thead><tbody>
<tr><td>One-hot</td><td>One binary column per level</td><td>Low cardinality (&lt;~15), no order, linear models</td><td>Dimensionality explosion; sparse trees split poorly</td></tr>
<tr><td>Label / ordinal</td><td>Map to integers</td><td><strong>Genuine order only</strong> — Small &lt; Medium &lt; Large</td><td>Invents a false ordering for nominal data. Fine for trees, harmful for linear/distance models</td></tr>
<tr><td>Target / mean encoding</td><td>Replace level with mean target for that level</td><td>High cardinality with real signal</td><td><strong>Severe leakage</strong> unless computed out-of-fold with smoothing</td></tr>
<tr><td>Frequency / count</td><td>Replace with occurrence count</td><td>High cardinality, cheap, leak-free</td><td>Collides levels that share a count</td></tr>
<tr><td>Hashing</td><td>Hash into fixed buckets</td><td>Very high or unbounded cardinality, streaming</td><td>Collisions; loses interpretability</td></tr>
<tr><td>Embeddings</td><td>Learn a dense vector per level</td><td>Very high cardinality, neural models, IDs</td><td>Needs volume; cold start for unseen levels</td></tr>
<tr><td>CatBoost ordered TS</td><td>Target stats using only prior rows</td><td>High-cardinality tabular</td><td>Built into the library — use it</td></tr>
</tbody></table>
<p><strong>"When would you NOT use one-hot encoding?"</strong> High cardinality — 50,000 cities or product SKUs. You get 50,000 sparse columns, memory blows up, and tree models degrade because each binary split isolates a single level and carries almost no information. Use target encoding (out-of-fold), frequency encoding, or embeddings instead.</p>
<div class="trap"><b>Target encoding leakage — the classic senior filter.</b> If you compute the mean target per level using the row's own target, the model sees the answer. You must use K-fold out-of-fold encoding (compute the encoding for fold i from folds ≠ i) plus smoothing toward the global mean for rare levels: <code>enc = (n·mean_level + m·mean_global) / (n + m)</code>. Also decide your policy for unseen levels at inference: fall back to the global mean.</div>`},

{q:"Normalization vs standardization — and which models need which",
roles:["ds","aie"],lvl:"core",tags:["features","high-freq"],
a:`<table><thead><tr><th></th><th>Normalization (Min-Max)</th><th>Standardization (Z-score)</th></tr></thead><tbody>
<tr><td>Formula</td><td><code>(x − min) / (max − min)</code></td><td><code>(x − μ) / σ</code></td></tr>
<tr><td>Result</td><td>Bounded to [0,1] (or [−1,1])</td><td>Mean 0, std 1, unbounded</td></tr>
<tr><td>Centers data?</td><td>No</td><td>Yes</td></tr>
<tr><td>Outlier sensitivity</td><td><strong>Very high</strong> — one extreme value squashes everything else</td><td>Moderate</td></tr>
<tr><td>Preserves shape</td><td>Yes (linear rescale)</td><td>Yes (linear rescale)</td></tr>
<tr><td>Use for</td><td>Neural nets with bounded activations, image pixels, distance metrics needing a fixed range</td><td>PCA, SVM, KNN, k-means, logistic/linear regression, anything with L1/L2 penalties</td></tr>
</tbody></table>
<p><strong>Worked on [10,20,30,40,50]:</strong> normalized → [0, 0.25, 0.5, 0.75, 1]. Standardized (μ=30, σ≈14.14) → [−1.41, −0.71, 0, 0.71, 1.41].</p>
<p><strong>Which models need scaling:</strong></p>
<ul>
<li><strong>Required:</strong> KNN, k-means, SVM, PCA, any gradient-descent-trained linear model, neural networks, anything with a distance metric or a regularization penalty.</li>
<li><strong>Not required:</strong> decision trees, random forest, XGBoost/LightGBM/CatBoost — splits are on thresholds within a single feature, so monotonic rescaling changes nothing.</li>
</ul>
<p><strong>Also know:</strong> <code>RobustScaler</code> (median and IQR — use when outliers are present), <code>PowerTransformer</code> / Yeo-Johnson and Box-Cox (make skewed data more Gaussian), and <code>QuantileTransformer</code> (forces a uniform or normal marginal).</p>
<div class="trap"><b>Trap:</b> "Neither is needed for XGBoost, so scaling never matters for tabular work." It still matters the moment you add a linear meta-learner on top, compute distances for a nearest-neighbour feature, or apply L1/L2.</div>`},

{q:"How do you handle outliers?",
roles:["ds"],lvl:"core",tags:["features"],
a:`<p><strong>Detect:</strong></p>
<ul>
<li><strong>IQR rule:</strong> outside <code>[Q1 − 1.5·IQR, Q3 + 1.5·IQR]</code>. Distribution-free — the default.</li>
<li><strong>Z-score:</strong> |z| &gt; 3. Only valid if roughly normal, and the outliers themselves inflate σ. Use modified z-score with MAD instead.</li>
<li><strong>Model-based:</strong> Isolation Forest, Local Outlier Factor, DBSCAN noise points, autoencoder reconstruction error — these catch multivariate outliers that per-column rules miss.</li>
<li><strong>Domain rules:</strong> age = 200, negative revenue, timestamp in the future. These are data errors, not outliers.</li>
</ul>
<p><strong>Treat — and the decision comes first:</strong></p>
<ol>
<li><strong>Is it an error or a real extreme?</strong> Errors get fixed or dropped. Real extremes usually stay.</li>
<li><strong>Winsorize / cap</strong> at the 1st and 99th percentile — keeps the row, limits the leverage.</li>
<li><strong>Transform</strong> — log or Box-Cox compresses the tail without discarding anything.</li>
<li><strong>Robust models / losses</strong> — trees are naturally robust; Huber or quantile loss for regression.</li>
<li><strong>Model them separately</strong> — sometimes the outliers are the business (fraud, whale customers), and deleting them deletes the problem you were hired to solve.</li>
</ol>
<div class="say"><b>Say this:</b> "I separate data errors from genuine extremes before doing anything. Errors get fixed; genuine extremes usually get capped or log-transformed rather than dropped, because in fraud, churn and revenue work the tail is frequently the signal. And I always record the capping thresholds as model artifacts, because the same caps have to be applied identically at serving time."</div>`},

{q:"Feature selection methods",
roles:["ds"],lvl:"core",tags:["features"],
a:`<ul>
<li><strong>Filter</strong> (model-agnostic, cheap, run first): correlation with target, chi-square for categorical, ANOVA F-test, mutual information (catches non-linear dependence), variance threshold, and dropping one of each highly-correlated pair.</li>
<li><strong>Wrapper</strong> (uses the model, expensive): Recursive Feature Elimination (RFE), forward selection, backward elimination, exhaustive search.</li>
<li><strong>Embedded</strong> (selection happens during fitting — usually the best value): L1/Lasso, tree feature importances, gradient-boosting gain.</li>
<li><strong>Permutation importance</strong> — shuffle one feature, measure the drop in validation score. Model-agnostic and far more trustworthy than tree impurity importance, which is biased toward high-cardinality features.</li>
<li><strong>SHAP</strong> — per-prediction attributions with consistency guarantees; use for both selection and explainability.</li>
</ul>
<p><strong>Why bother:</strong> less overfitting, faster training and inference, cheaper feature pipelines to maintain in production, and easier explainability for regulated domains. The production-cost argument is the one juniors forget — every feature is a pipeline you have to keep alive, monitor for drift, and backfill.</p>
<div class="trap"><b>Trap:</b> Doing feature selection on the full dataset before CV. That's selection leakage, and it inflates your CV score. Selection belongs inside the CV pipeline.</div>`},

{q:"Data leakage — name the kinds and how you prevent each",
roles:["ds","aie"],lvl:"senior",tags:["features","senior-signal","high-freq"],
a:`<p>Leakage is when information unavailable at prediction time reaches the model. It is the single most common reason a model that looked excellent offline fails in production.</p>
<table><thead><tr><th>Kind</th><th>Example</th><th>Prevention</th></tr></thead><tbody>
<tr><td><strong>Target leakage</strong></td><td><code>account_closed_date</code> as a feature for churn; <code>total_paid</code> for default prediction</td><td>For every feature ask "was this knowable at the prediction timestamp?"</td></tr>
<tr><td><strong>Train-test contamination</strong></td><td>Scaler/imputer/encoder fitted before the split</td><td>Everything that learns parameters goes in a <code>Pipeline</code>, fitted per fold</td></tr>
<tr><td><strong>Temporal leakage</strong></td><td>Random k-fold on time-ordered data; backfilled values</td><td>Walk-forward CV with a purge/embargo gap</td></tr>
<tr><td><strong>Group leakage</strong></td><td>Same user's sessions split across train and test</td><td><code>GroupKFold</code> on the entity id</td></tr>
<tr><td><strong>Duplicate leakage</strong></td><td>Near-duplicate rows or documents on both sides</td><td>Dedup by hash / near-dup detection before splitting</td></tr>
<tr><td><strong>Target encoding leakage</strong></td><td>Level mean computed including the row's own target</td><td>Out-of-fold encoding + smoothing</td></tr>
<tr><td><strong>Feature-store skew</strong></td><td>Training features computed with full-history SQL; serving features computed live and differently</td><td>One feature definition, shared by training and serving; log served features and reconcile</td></tr>
</tbody></table>
<div class="say"><b>Say this:</b> "My first reaction to a surprisingly good model is to look for leakage, not to celebrate. I check the top features by importance and ask whether each was truly knowable at prediction time, I confirm every learned transform sits inside the CV pipeline, and I validate on an out-of-time holdout. In my RAG and tabular work the leak that bit hardest was a feature whose upstream table was updated retroactively — offline it looked predictive, online it was empty at inference."</div>`}
]},

{
title:"Tree ensembles & boosting",
items:[
{q:"How does a decision tree decide where to split?",
roles:["ds"],lvl:"core",tags:["trees","high-freq"],
a:`<p>Greedily, one node at a time: evaluate every (feature, threshold) candidate and pick the one that maximizes impurity reduction (information gain).</p>
<pre><code>Gini     = 1 − Σ pᵢ²
Entropy  = − Σ pᵢ log₂ pᵢ
Gain     = Impurity(parent) − Σ (nⱼ/n) · Impurity(childⱼ)

Regression: minimize variance / MSE reduction</code></pre>
<p><strong>Gini vs entropy:</strong> both measure node purity and give very similar trees. Gini is cheaper (no logarithm) and is scikit-learn's default; entropy is slightly more sensitive to class-probability changes. This is rarely worth tuning.</p>
<p><strong>Stopping / pruning:</strong> <code>max_depth</code>, <code>min_samples_split</code>, <code>min_samples_leaf</code>, <code>min_impurity_decrease</code>, and cost-complexity pruning (<code>ccp_alpha</code>) which grows the full tree then prunes back.</p>
<p><strong>Properties to state:</strong> no scaling needed, handles mixed types, naturally captures interactions, fully interpretable — but a single tree is high-variance and unstable (change a few rows and the whole structure changes), which is exactly the motivation for ensembles.</p>`},

{q:"Bagging vs boosting — the answer and the one-liner",
roles:["ds","aie"],lvl:"core",tags:["trees","high-freq"],
a:`<table><thead><tr><th></th><th>Bagging</th><th>Boosting</th></tr></thead><tbody>
<tr><td>Training</td><td><strong>Parallel</strong> — independent models on bootstrap samples</td><td><strong>Sequential</strong> — each model corrects the previous one's errors</td></tr>
<tr><td>Primarily reduces</td><td><strong>Variance</strong></td><td><strong>Bias</strong></td></tr>
<tr><td>Base learners</td><td>Strong, deep, low-bias/high-variance trees</td><td>Weak, shallow trees (often depth 1–6)</td></tr>
<tr><td>Combination</td><td>Average / majority vote — equal weight</td><td>Weighted sum, weights learned during training</td></tr>
<tr><td>Overfitting risk</td><td>Low; more trees rarely hurts</td><td>Higher; too many rounds overfits → needs early stopping</td></tr>
<tr><td>Outlier sensitivity</td><td>Low</td><td>High — boosting chases hard examples, including mislabeled ones</td></tr>
<tr><td>Parallelizable</td><td>Trivially</td><td>Not across trees (only within a tree's split search)</td></tr>
<tr><td>Examples</td><td>Random Forest, Extra Trees, Bagged SVMs</td><td>AdaBoost, GBM, XGBoost, LightGBM, CatBoost</td></tr>
</tbody></table>
<pre><code>BAGGING (parallel)              BOOSTING (sequential)
  Data                            Tree1
   ├── Tree1 ┐                      ↓ residuals/weights
   ├── Tree2 ├→ average             Tree2
   └── Tree3 ┘                      ↓ residuals/weights
                                    Tree3</code></pre>
<div class="say"><b>One-liner to have ready:</b> "Bagging is parallel and fights variance by averaging decorrelated strong learners. Boosting is sequential and fights bias by having each weak learner fit what the ensemble got wrong. So bagging is my safe default and boosting is where I go for maximum accuracy with careful early stopping."</div>`},

{q:"Why does Random Forest reduce overfitting compared to a single tree?",
roles:["ds"],lvl:"core",tags:["trees","high-freq"],
a:`<p>Two sources of randomness make the trees <strong>decorrelated</strong>, and averaging decorrelated estimators reduces variance.</p>
<ol>
<li><strong>Bootstrap sampling (bagging)</strong> — each tree sees a different random sample with replacement (~63% of unique rows).</li>
<li><strong>Random feature subsetting at each split</strong> — only <code>max_features</code> candidates are considered (√p for classification, p/3 for regression). This is the key ingredient: without it, one dominant feature would be the top split in every tree and the trees would be near-identical.</li>
</ol>
<p><strong>The math:</strong> averaging n estimators each with variance σ² and pairwise correlation ρ gives variance <code>ρσ² + (1−ρ)σ²/n</code>. The second term vanishes as n grows, but the first is floored by ρ. Feature subsetting is what lowers ρ — and therefore what lowers the floor.</p>
<p><strong>Bonus properties:</strong> out-of-bag (OOB) error gives you a free validation estimate from the ~37% of rows each tree didn't see; feature importances come out of the box; it parallelizes perfectly; and each tree individually overfits but the average does not.</p>
<div class="say"><b>Say this:</b> "Averaging reduces variance, but only if the trees are decorrelated — and bootstrap sampling alone isn't enough, because one strong feature would dominate the root split of every tree. Random feature subsetting at each split is what actually decorrelates them, and that's the part people leave out."</div>`},

{q:"Logistic regression vs Random Forest vs XGBoost — how do you choose?",
roles:["ds","aie"],lvl:"core",tags:["trees","model-selection","high-freq"],
a:`<table><thead><tr><th></th><th>Logistic Regression</th><th>Random Forest</th><th>XGBoost</th></tr></thead><tbody>
<tr><td>Decision boundary</td><td>Linear (in log-odds)</td><td>Non-linear, axis-aligned</td><td>Non-linear, axis-aligned</td></tr>
<tr><td>Interpretability</td><td><strong>High</strong> — coefficients are odds ratios</td><td>Medium — importances, no direction</td><td>Medium — SHAP recovers it</td></tr>
<tr><td>Accuracy on tabular</td><td>Baseline</td><td>Strong with almost no tuning</td><td><strong>Usually best</strong>, with tuning</td></tr>
<tr><td>Tuning burden</td><td>Minimal (C, penalty)</td><td>Low</td><td>High — lr, depth, n_estimators, subsample, colsample, min_child_weight, gamma, reg_alpha/lambda</td></tr>
<tr><td>Scaling needed</td><td>Yes</td><td>No</td><td>No</td></tr>
<tr><td>Missing values</td><td>Must impute</td><td>Must impute (sklearn)</td><td>Handled natively</td></tr>
<tr><td>Training speed</td><td>Fastest</td><td>Fast, parallel</td><td>Slower, sequential</td></tr>
<tr><td>Inference latency</td><td>Microseconds</td><td>Moderate (many trees)</td><td>Moderate</td></tr>
<tr><td>Small data</td><td>Best choice</td><td>OK</td><td>Overfits easily</td></tr>
<tr><td>Extrapolation</td><td>Yes</td><td><strong>No</strong> — predicts flat outside the training range</td><td><strong>No</strong></td></tr>
<tr><td>Calibration out of the box</td><td>Good</td><td>Fair</td><td>Poor (needs calibration)</td></tr>
</tbody></table>
<div class="say"><b>Say this — the framework matters more than the table:</b> "I always fit logistic regression first, because it's a real baseline in an hour and if it's within a point of the complex model I ship it — it's cheaper to serve, easier to explain to a regulator and easier to debug. Then Random Forest for a strong low-effort non-linear benchmark, then XGBoost if the accuracy gain justifies the tuning and monitoring cost. And if the deliverable is an explanation rather than a prediction — 'which factors drive churn' — I stay with the linear model regardless of AUC."</div>
<div class="trap"><b>Senior nuance to volunteer:</b> Tree models cannot extrapolate. If your target trends over time and you predict forward, a tree flatlines at the last seen level. Either detrend the target first or use a model class that extrapolates.</div>`},

{q:"AdaBoost vs Gradient Boosting vs XGBoost vs LightGBM vs CatBoost",
roles:["ds"],lvl:"core",tags:["trees","high-freq"],
a:`<p><strong>AdaBoost</strong> — reweights <em>samples</em>. Misclassified examples get higher weight so the next weak learner (usually a depth-1 stump) focuses on them. Each learner also gets a weight based on its accuracy. Optimizes exponential loss, which makes it very sensitive to label noise and outliers.</p>
<p><strong>Gradient Boosting (GBM)</strong> — reweights nothing; each new tree fits the <strong>negative gradient of the loss</strong> with respect to the current predictions. For squared loss that gradient is just the residual:</p>
<pre><code>prediction = 100, actual = 120  →  residual = 20
next tree learns to predict 20
F_m(x) = F_{m-1}(x) + ν · h_m(x)      ν = learning rate (shrinkage)</code></pre>
<p>Generalizes to any differentiable loss (log loss, Huber, quantile, Poisson, ranking objectives).</p>
<p><strong>XGBoost</strong> — an engineered, regularized GBM. What it adds:</p>
<ul>
<li><strong>Explicit regularization in the objective:</strong> <code>Obj = Σ L(yᵢ, ŷᵢ) + Σ [ γT + ½λ‖w‖² ]</code> — penalizing leaf count T and leaf weights w. This is the single biggest reason it generalizes better than vanilla GBM.</li>
<li><strong>Second-order optimization</strong> — uses gradient <em>and</em> Hessian (a Newton step), so it converges in fewer, better-aimed rounds.</li>
<li><strong>Sparsity-aware split finding</strong> — learns a default direction for missing values, no imputation needed.</li>
<li><strong>Parallelized split search</strong>, weighted quantile sketch for approximate splits, cache-aware block structure, out-of-core training.</li>
<li><strong>Built-in early stopping and column/row subsampling</strong> (stochastic boosting, which also decorrelates trees).</li>
</ul>
<p><strong>LightGBM</strong> — leaf-wise growth (splits the leaf with max loss reduction, not level-by-level) plus histogram binning, GOSS (gradient-based one-side sampling) and EFB (exclusive feature bundling). Much faster and more memory-efficient on large data; more prone to overfitting on small data, so control <code>num_leaves</code> and <code>min_data_in_leaf</code>.</p>
<p><strong>CatBoost</strong> — <em>ordered</em> target statistics for categorical features (uses only rows that come before, avoiding target leakage) and ordered boosting to avoid prediction shift. Best out-of-the-box on data with many high-cardinality categoricals, and good default hyperparameters.</p>
<div class="say"><b>Compressed answer:</b> "AdaBoost reweights samples with exponential loss. Gradient boosting fits the negative gradient of an arbitrary loss, which for MSE is the residual. XGBoost is a regularized second-order gradient boosting with leaf-count and leaf-weight penalties in the objective, native missing-value handling and a parallelized split search — the regularization is why it generalizes better. LightGBM trades level-wise for leaf-wise growth and histograms for speed at scale, and CatBoost handles high-cardinality categoricals without target leakage."</div>`},

{q:"Which XGBoost hyperparameters do you actually tune, and in what order?",
roles:["ds"],lvl:"senior",tags:["trees","tuning"],
a:`<ol>
<li><strong>Set <code>n_estimators</code> high and let early stopping decide.</strong> Never tune it directly; use <code>early_stopping_rounds</code> on a validation set.</li>
<li><strong><code>learning_rate</code> (eta)</strong> — 0.01–0.3. Lower is better but needs more rounds. Tune this against n_estimators as a pair.</li>
<li><strong>Tree complexity:</strong> <code>max_depth</code> (3–10; start 6), <code>min_child_weight</code> (minimum sum of instance weight in a child — raise it to fight overfitting).</li>
<li><strong>Stochasticity:</strong> <code>subsample</code> (0.6–1.0, row sampling per tree), <code>colsample_bytree</code> (0.6–1.0, feature sampling). Both reduce variance and decorrelate trees.</li>
<li><strong>Regularization:</strong> <code>gamma</code> / min_split_loss (minimum gain to make a split), <code>reg_lambda</code> (L2 on leaf weights), <code>reg_alpha</code> (L1).</li>
<li><strong>Imbalance:</strong> <code>scale_pos_weight</code> ≈ neg/pos ratio — but remember this breaks calibration.</li>
</ol>
<p><strong>Search strategy:</strong> random search or Bayesian optimization (Optuna, Hyperopt) over grid search — grid search wastes evaluations on dimensions that don't matter. Use successive halving / ASHA to kill bad trials early. Always tune with the same CV scheme you'll report with, and tune against the metric you actually care about, not accuracy.</p>
<div class="say"><b>Say this:</b> "I fix n_estimators high with early stopping, then tune learning rate against depth and min_child_weight, then add subsample and colsample for variance reduction, then regularization last. I use Optuna rather than grid search because the parameter importance is very uneven, and I tune against PR-AUC or a cost-weighted metric rather than accuracy."</div>`},

{q:"How do you handle class imbalance?",
roles:["ds","aie"],lvl:"core",tags:["imbalance","high-freq"],
a:`<p><strong>Start at the metric and the threshold, not the data.</strong> Most "imbalance problems" are really metric problems.</p>
<ol>
<li><strong>Fix the metric:</strong> PR-AUC, recall at a fixed precision, F-beta, MCC, or expected cost. Drop accuracy.</li>
<li><strong>Tune the decision threshold</strong> on a validation set against business cost. This is free, doesn't distort the data, and preserves calibration. It is very often the whole solution.</li>
<li><strong>Cost-sensitive learning:</strong> <code>class_weight='balanced'</code>, <code>scale_pos_weight</code>, or a custom loss (focal loss down-weights easy examples). Keeps all the data.</li>
<li><strong>Resampling</strong> — only if the above isn't enough:
<ul>
<li><em>Random undersampling</em> the majority — fast, but throws away data.</li>
<li><em>Random oversampling</em> the minority — risks memorizing duplicates.</li>
<li><em>SMOTE</em> — synthesizes minority points by interpolating between a point and its k nearest minority neighbours. Variants: Borderline-SMOTE, ADASYN, SMOTE-NC for categoricals.</li>
<li><em>Under+over combos</em> — SMOTEENN, SMOTETomek.</li>
</ul></li>
<li><strong>Anomaly-detection framing</strong> if positives are &lt;0.1% — one-class SVM, Isolation Forest, autoencoder reconstruction error.</li>
<li><strong>Get more positives</strong> — targeted labeling, active learning, weak supervision. Often the highest-leverage move and the one candidates never mention.</li>
</ol>
<div class="trap"><b>Two traps they will probe.</b> (1) <strong>SMOTE must be applied inside the CV loop, on the training fold only.</strong> Oversampling before splitting puts synthetic neighbours of test points into training and produces a beautiful, meaningless score. (2) <strong>Any rebalancing breaks calibration.</strong> After resampling or class weighting, your predicted probabilities no longer reflect the true base rate — recalibrate, or correct the intercept by <code>log(π_train/π_true)</code>, before anyone multiplies them by money.</div>
<div class="say"><b>Say this:</b> "I treat imbalance as a metric-and-threshold problem first. Switch to PR-AUC, tune the threshold against the cost of a miss versus a false alarm, then use class weights. I only reach for SMOTE if that's not enough, I apply it strictly inside the training fold, and I recalibrate afterwards because rebalancing always distorts the probabilities."</div>`}
]},

{
title:"Optimization & gradient descent",
items:[
{q:"Types of gradient descent — batch, stochastic, mini-batch",
roles:["ds","aie"],lvl:"core",tags:["optimization","high-freq"],
a:`<pre><code>θ ← θ − α ∇J(θ)</code></pre>
<table><thead><tr><th></th><th>Batch</th><th>Stochastic (SGD)</th><th>Mini-batch</th></tr></thead><tbody>
<tr><td>Data per update</td><td>Entire dataset</td><td>One sample</td><td>32 / 64 / 128 / 256</td></tr>
<tr><td>Updates per epoch</td><td>1</td><td>n</td><td>n / batch_size</td></tr>
<tr><td>Gradient estimate</td><td>Exact</td><td>Very noisy</td><td>Low-variance estimate</td></tr>
<tr><td>Convergence path</td><td>Smooth, stable</td><td>Noisy, oscillating</td><td>Moderately smooth</td></tr>
<tr><td>Memory</td><td>High — must hold all data</td><td>Minimal</td><td>Tunable</td></tr>
<tr><td>Speed per update</td><td>Slow</td><td>Fast</td><td>Fast</td></tr>
<tr><td>Hardware fit</td><td>Poor</td><td>Poor — no vectorization</td><td><strong>Excellent — saturates GPU</strong></td></tr>
<tr><td>Local minima escape</td><td>Poor — can settle in a sharp minimum</td><td>Good — noise helps escape</td><td>Good</td></tr>
<tr><td>In practice</td><td>Rare (small data, convex)</td><td>Rare in its pure form</td><td><strong>Universal default</strong></td></tr>
</tbody></table>
<p><strong>Why mini-batch won:</strong> it gets most of batch GD's gradient quality at a fraction of the cost, retains enough noise to escape sharp minima and saddle points, and — decisively — it's the only variant that maps onto GPU matrix multiplication. A batch of 1 leaves the hardware idle.</p>
<p><strong>Senior additions:</strong> batch size interacts with learning rate (the linear scaling rule: double the batch, roughly double the LR, with warmup). Very large batches generalize worse without correction — that's the large-batch generalization gap, addressed with LARS/LAMB, warmup, and label smoothing. Gradient accumulation simulates a large batch when memory is the constraint.</p>`},

{q:"Beyond plain SGD: momentum, RMSProp, Adam, AdamW",
roles:["ds","aie"],lvl:"core",tags:["optimization"],
a:`<ul>
<li><strong>Momentum</strong> — accumulate an exponentially-weighted velocity of past gradients: <code>v ← βv + ∇J; θ ← θ − αv</code>. Damps oscillation across a ravine and accelerates along its floor. β typically 0.9.</li>
<li><strong>Nesterov momentum</strong> — evaluates the gradient at the lookahead position; slightly better convergence.</li>
<li><strong>AdaGrad</strong> — per-parameter learning rate scaled by <code>1/√(accumulated squared gradients)</code>. Great for sparse features; but the accumulator only grows, so the LR decays to zero and learning stalls.</li>
<li><strong>RMSProp</strong> — fixes that with an exponential moving average of squared gradients instead of a sum.</li>
<li><strong>Adam</strong> — momentum + RMSProp, with bias correction:
<pre><code>m ← β₁m + (1−β₁)g          (1st moment, mean)
v ← β₂v + (1−β₂)g²         (2nd moment, uncentered variance)
m̂ = m/(1−β₁ᵗ),  v̂ = v/(1−β₂ᵗ)
θ ← θ − α · m̂ / (√v̂ + ε)</code></pre>
Defaults β₁=0.9, β₂=0.999, ε=1e-8. The default for almost everything.</li>
<li><strong>AdamW</strong> — <strong>decoupled weight decay</strong>. In Adam, L2 added to the loss gets divided by √v̂, so heavily-updated parameters are barely regularized. AdamW applies decay directly to the weights instead: <code>θ ← θ − α·m̂/(√v̂+ε) − αλθ</code>. This is the correct version and the standard for all transformer training.</li>
</ul>
<p><strong>LR schedules:</strong> linear/cosine decay, warmup (essential for transformers — early Adam second-moment estimates are unreliable), cosine with restarts, one-cycle, ReduceLROnPlateau.</p>
<div class="say"><b>Say this:</b> "AdamW with warmup and cosine decay is my default for anything deep. Adam combines momentum with per-parameter adaptive scaling, and the W matters because coupling L2 into an adaptive optimizer effectively removes the regularization from the parameters that need it most. For classical convex problems I'd still use L-BFGS or plain SGD with momentum, which often generalizes slightly better on vision tasks."</div>`},

{q:"What is gradient clipping and what is the 'g vector'?",
roles:["aie","ds"],lvl:"core",tags:["optimization"],
a:`<p><strong>g</strong> is the gradient vector: the concatenation of ∂L/∂θ for every trainable parameter in the model. If your model has three parameters with gradients 0.5, 2.0, 3.0, then <code>g = [0.5, 2.0, 3.0]</code>.</p>
<p><strong>‖g‖</strong> is its norm (usually L2), i.e. its length:</p>
<pre><code>‖g‖ = √(0.5² + 2.0² + 3.0²) = √13.25 ≈ 3.64</code></pre>
<p><strong>Clipping by norm</strong> rescales the whole vector when it exceeds a threshold, <em>preserving its direction</em>:</p>
<pre><code>if ‖g‖ > threshold:
    g ← (g / ‖g‖) · threshold</code></pre>
<p>With threshold = 2: <code>g_clipped = [0.5, 2.0, 3.0]/3.64 · 2 ≈ [0.275, 1.10, 1.65]</code>. Same direction, length now exactly 2.</p>
<p><strong>Why:</strong> exploding gradients. One bad batch produces a huge gradient, the update overshoots into a region of enormous loss, and training diverges to NaN. Clipping bounds the step size without changing which way you step. Standard in RNNs and in all LLM pretraining (typical max-norm 1.0).</p>
<p><strong>Clip by norm vs by value:</strong> clip-by-value truncates each component independently, which <em>changes the update direction</em> and is generally worse. Prefer <code>clip_grad_norm_</code> over <code>clip_grad_value_</code>. Clip on the <em>global</em> norm across all parameters, not per-layer, so relative layer scaling is preserved.</p>`},

{q:"Vanishing and exploding gradients — cause and the full mitigation stack",
roles:["aie","ds"],lvl:"core",tags:["optimization","dl"],
a:`<p><strong>Cause:</strong> backprop multiplies Jacobians layer by layer. If the typical factor is &lt;1, the product shrinks geometrically with depth (vanishing); if &gt;1, it grows geometrically (exploding). Sigmoid saturates with a max derivative of 0.25, so a 10-layer sigmoid network attenuates the gradient by up to 0.25¹⁰ ≈ 1e-6 — the early layers receive essentially nothing.</p>
<p><strong>Mitigations, and which problem each solves:</strong></p>
<table><thead><tr><th>Technique</th><th>Vanishing</th><th>Exploding</th></tr></thead><tbody>
<tr><td>ReLU / GELU / SwiGLU (derivative 1 in the active region)</td><td>✔</td><td></td></tr>
<tr><td>Residual / skip connections (gradient highway, <code>∂/∂x (x + f(x)) = 1 + f'</code>)</td><td>✔✔</td><td></td></tr>
<tr><td>Careful init — He for ReLU, Xavier/Glorot for tanh</td><td>✔</td><td>✔</td></tr>
<tr><td>BatchNorm / LayerNorm / RMSNorm</td><td>✔</td><td>✔</td></tr>
<tr><td>Gradient clipping</td><td></td><td>✔✔</td></tr>
<tr><td>LSTM/GRU gating (additive cell state)</td><td>✔</td><td></td></tr>
<tr><td>Lower learning rate + warmup</td><td></td><td>✔</td></tr>
<tr><td>Pre-LN transformer blocks (norm before the sublayer)</td><td>✔</td><td>✔</td></tr>
</tbody></table>
<p><strong>The two that matter most:</strong> residual connections and normalization. Together they're why 100-layer networks train at all, and why the transformer block is built the way it is.</p>`}
]},

{
title:"Statistics, experimentation & causal inference",
items:[
{q:"Explain hypothesis testing, p-values, and what a p-value is NOT",
roles:["ds"],lvl:"core",tags:["stats","high-freq"],
a:`<ol>
<li>State H₀ (no effect) and H₁ (effect).</li>
<li>Choose a test statistic and significance level α (conventionally 0.05).</li>
<li>Compute the statistic and its p-value.</li>
<li>If p &lt; α, reject H₀.</li>
</ol>
<p><strong>A p-value is</strong> P(observing data at least this extreme | H₀ is true).</p>
<p><strong>A p-value is NOT:</strong></p>
<ul>
<li>The probability that H₀ is true. (That's P(H₀|data) — a Bayesian quantity requiring a prior.)</li>
<li>The probability you made a mistake.</li>
<li>A measure of effect size. A p of 0.001 on a 0.01% lift is statistically significant and commercially worthless.</li>
</ul>
<table><thead><tr><th></th><th>H₀ true</th><th>H₀ false</th></tr></thead><tbody>
<tr><td>Reject H₀</td><td><strong>Type I error</strong> (α) — false positive</td><td>Correct (power = 1−β)</td></tr>
<tr><td>Fail to reject</td><td>Correct</td><td><strong>Type II error</strong> (β) — false negative</td></tr>
</tbody></table>
<p><strong>Power</strong> = 1−β, the probability of detecting a real effect. Driven by effect size, sample size, variance and α. Underpowered tests are the silent epidemic of industry A/B testing: they produce noisy, unreplicable "wins."</p>
<p><strong>Multiple comparisons:</strong> testing 20 metrics at α=0.05 gives you roughly a 64% chance of at least one false positive. Correct with Bonferroni (conservative) or Benjamini–Hochberg FDR (usually the right choice for many metrics).</p>
<div class="say"><b>Say this:</b> "The p-value is the probability of data this extreme under the null, not the probability the null is true — and I always pair it with an effect size and a confidence interval, because significance without magnitude can't support a business decision. I also pre-declare one primary metric so I'm not shopping across twenty secondary ones."</div>`},

{q:"Design an A/B test end to end",
roles:["ds"],lvl:"senior",tags:["experimentation","high-freq","senior-signal"],
a:`<p><strong>1. Hypothesis and metrics.</strong> One primary metric tied to the decision. Secondary metrics for mechanism. <strong>Guardrail metrics</strong> that must not degrade (latency, crash rate, revenue per user, unsubscribes). Declare all of this before you start.</p>
<p><strong>2. Unit of randomization.</strong> User, session, or cluster. Must match the level at which the treatment acts and at which you'll analyze. Randomizing by session when the experience is sticky across sessions contaminates both arms.</p>
<p><strong>3. Power analysis before launch.</strong> Pick the minimum detectable effect (MDE) that would change the decision, then solve for n:</p>
<pre><code>n per arm ≈ 16 · σ² / MDE²        (for α=0.05, power=0.8, two-sided)</code></pre>
<p>If the required sample exceeds your traffic in a reasonable window, either accept a larger MDE, reduce variance, or don't run the test.</p>
<p><strong>4. Sanity checks.</strong> A/A test the pipeline. Sample Ratio Mismatch check — if you assigned 50/50 and observe 50.6/49.4 with high traffic, the assignment is broken and the result is invalid. Check pre-experiment metric balance across arms.</p>
<p><strong>5. Run to the planned duration.</strong> Cover full weekly cycles. Watch for novelty and primacy effects — a new UI often wins in week one and reverts in week three.</p>
<p><strong>6. Analyze.</strong> Two-sample t-test or proportions z-test; delta method or bootstrap for ratio metrics; CUPED (using a pre-period covariate) to cut variance 30–50% and reach significance faster. Report effect size with confidence interval, not just p.</p>
<p><strong>7. Decide,</strong> including the cost of the change, and check heterogeneous treatment effects across key segments before rolling out.</p>
<div class="trap"><b>The trap that separates senior from mid:</b> <strong>peeking.</strong> Checking results daily and stopping when p &lt; 0.05 inflates your false positive rate far beyond 5% — with daily peeking over two weeks it can exceed 30%. Either fix the duration in advance, or use a method designed for continuous monitoring: sequential testing, always-valid p-values, group sequential boundaries (O'Brien–Fleming), or a Bayesian approach with a pre-declared decision rule.</div>
<div class="trap"><b>Also know:</b> interference/network effects (social features violate independence — use cluster randomization), the multiple-testing problem across simultaneous experiments, Simpson's paradox when pooling segments, and survivorship bias in the metric window.</div>`},

{q:"Correlation vs causation — how do you estimate causal effects without an A/B test?",
roles:["ds"],lvl:"senior",tags:["causal","senior-signal"],
a:`<p>When randomization is impossible (can't randomly deny people a product, can't randomize a pricing change by law, the treatment already happened), you need quasi-experimental designs.</p>
<ul>
<li><strong>Difference-in-Differences (DiD)</strong> — compare the before/after change in a treated group to the before/after change in an untreated control. Cancels out time-invariant group differences and common time trends. Key assumption: <em>parallel trends</em> — validate on pre-period data.</li>
<li><strong>Propensity score matching / IPW</strong> — model P(treatment | covariates), then match or weight to balance observed confounders. Only handles <em>observed</em> confounding; check standardized mean differences after matching.</li>
<li><strong>Instrumental variables</strong> — find a variable that affects treatment but not the outcome directly. Classic: distance to a facility, random assignment of a nudge, weather.</li>
<li><strong>Regression discontinuity</strong> — exploit a sharp threshold (credit score cutoff, exam pass mark) where treatment flips but underlying units are nearly identical.</li>
<li><strong>Synthetic control</strong> — build a weighted combination of untreated units that reproduces the treated unit's pre-period trajectory. Good for a single treated geography.</li>
<li><strong>Uplift / heterogeneous treatment effect modeling</strong> — T-learner, S-learner, X-learner, causal forests. Answers "who should we treat," not just "did it work."</li>
</ul>
<p><strong>Frame confounding properly:</strong> a confounder causes both treatment and outcome (ice cream sales and drowning — both caused by summer). Controlling for a <em>collider</em> or a <em>mediator</em> introduces bias rather than removing it. A DAG is the tool for deciding what to control for; "throw every variable into the regression" is wrong and reveals it.</p>
<div class="say"><b>Say this:</b> "Randomization is the gold standard, so my first question is whether we can still run an experiment — even a small holdout or a staged geographic rollout. If not, I draw the causal graph to identify confounders, then pick the design that matches the data-generating process: DiD with a parallel-trends check if there's a clean before/after and a control group, regression discontinuity if there's a threshold, and propensity weighting only when I'm confident the important confounders are observed. I state the identifying assumption out loud, because that's what the estimate rests on."</div>`},

{q:"Explain the Central Limit Theorem and why it underpins industry A/B testing",
roles:["ds"],lvl:"core",tags:["stats"],
a:`<p>The CLT says the <strong>sampling distribution of the sample mean</strong> approaches a normal distribution as n grows, <em>regardless of the population's distribution</em>, with mean μ and standard error σ/√n.</p>
<p><strong>Why it matters:</strong> conversion rates are Bernoulli, revenue per user is heavily right-skewed, session length is log-normal — none are remotely normal. But we don't test individual values; we test <em>means</em>. The CLT is what licenses t-tests and normal-approximation confidence intervals on those means.</p>
<p><strong>Where it breaks, and what a senior candidate flags:</strong></p>
<ul>
<li><strong>Extremely heavy tails.</strong> Revenue with a few whale customers converges slowly; n=1000 may not be enough. Use bootstrap, trimmed means, or winsorize — and say so.</li>
<li><strong>Ratio metrics</strong> (CTR as clicks/impressions across users) aren't sample means of i.i.d. units. Use the delta method or bootstrap for the variance.</li>
<li><strong>Dependent observations.</strong> Multiple sessions per user break the i.i.d. assumption and understate variance. Cluster at the user level.</li>
</ul>
<p><strong>Note the distinction:</strong> the standard <em>deviation</em> σ describes the spread of the data; the standard <em>error</em> σ/√n describes the precision of your estimate of the mean. Confusing them is a common interview stumble.</p>`},

{q:"Bayes' theorem and the classic diagnostic-test question",
roles:["ds"],lvl:"core",tags:["stats","probability"],
a:`<pre><code>P(A|B) = P(B|A) · P(A) / P(B)</code></pre>
<p><strong>The question they ask:</strong> a disease affects 1 in 1000. A test has 99% sensitivity and 99% specificity. You test positive. What's the probability you have the disease?</p>
<p>Work it with counts over 100,000 people — much less error-prone than plugging into the formula:</p>
<pre><code>Diseased:      100    → 99 test positive   (99% sensitivity)
Not diseased:  99,900 → 999 test positive  (1% false positive rate)

Total positives = 99 + 999 = 1,098
P(disease | positive) = 99 / 1,098 ≈ 9%</code></pre>
<p><strong>About 9%, not 99%.</strong> The base rate dominates. This is <em>base rate neglect</em>, and it's the single most important statistical intuition for anyone building classifiers on rare events.</p>
<div class="say"><b>Connect it to your work:</b> "This is exactly why I don't report ROC-AUC alone on a rare-event model. A test with 99% specificity still produces ten false positives for every true one when the prevalence is 0.1% — the precision is what the operations team experiences, and the base rate is what drives it."</div>`},

{q:"Unsupervised learning: k-means, DBSCAN, PCA — and how you choose k",
roles:["ds"],lvl:"core",tags:["unsupervised"],
a:`<p><strong>k-means</strong> — minimize within-cluster sum of squares. Iterate: assign each point to nearest centroid, recompute centroids. Assumes spherical, similarly-sized clusters; sensitive to initialization (use k-means++) and to feature scale. O(nkdi).</p>
<p><strong>Choosing k:</strong> elbow method on inertia (subjective), <strong>silhouette score</strong> (better — measures cohesion vs separation, range −1 to 1), gap statistic, Davies–Bouldin, or — most importantly — <strong>downstream business usability</strong>. Seven customer segments nobody can act on is worse than three they can.</p>
<p><strong>DBSCAN</strong> — density-based. Finds arbitrarily shaped clusters, labels low-density points as noise, and <em>does not need k</em>. Parameters: <code>eps</code> (neighbourhood radius) and <code>min_samples</code>. Struggles with varying densities — HDBSCAN fixes that and is usually the better choice today.</p>
<p><strong>Also know:</strong> hierarchical/agglomerative clustering (gives a dendrogram, no k needed upfront), Gaussian Mixture Models (soft assignment, elliptical clusters, probabilistic).</p>
<p><strong>PCA</strong> — orthogonal linear projection onto directions of maximum variance, via eigendecomposition of the covariance matrix or SVD. <strong>Must standardize first</strong>, or the largest-variance feature dominates. Choose components by cumulative explained variance (e.g. 95%) or a scree plot. Used for compression, decorrelation, noise reduction, multicollinearity, and visualization.</p>
<p><strong>PCA vs t-SNE/UMAP:</strong> PCA is linear, deterministic, and preserves global structure — it's the one you can apply to new data with a learned transform. t-SNE and UMAP are non-linear and preserve local neighbourhoods; excellent for visualization, but distances between distant clusters are not meaningful and t-SNE has no natural out-of-sample transform. Never cluster on t-SNE coordinates and report it as a finding.</p>`}
]}
]});
