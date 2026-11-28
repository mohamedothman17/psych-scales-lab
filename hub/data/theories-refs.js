/* Theories library: checked references and recent evidence, keyed by theory id.
   Every entry here was matched against a search result (title, author, year, venue) on the date in CHECKED.
   A doi is present only where a search result showed it for that exact work. Findings are paraphrased from abstracts. */
(function () {
  'use strict';
  var T = window.HubTheories = window.HubTheories || { list: [] };
  var CHECKED = '2026-11-27';
  function C(id) { return 'https://consensus.app/papers/details/' + id + '/?utm_source=claude_desktop'; }
  /* classic reference */
  function R(authors, year, title, venue, url, source, doi, note) {
    var r = { authors: authors, year: year, title: title, venue: venue, url: url, source: source, verified: true, checkedOn: CHECKED };
    if (doi) r.doi = doi;
    if (note) r.note = note;
    return r;
  }
  function D(doi) { return 'https://doi.org/' + doi; }
  /* recent evidence item */
  function E(kind, authors, year, title, venue, id, finding, arab) {
    var e = { kind: kind, authors: authors, year: year, title: title, venue: venue, url: C(id), source: 'Consensus', checkedOn: CHECKED, finding: finding };
    if (arab) e.arab = true;
    return e;
  }

  T.checked = CHECKED;
  T.refs = {
    piaget: [
      R('Piaget, J.', '1952', 'The Origins of Intelligence in Children', 'New York: International Universities Press (ترجمة Margaret Cook؛ الأصل الفرنسي 1936)', 'https://library.usi.edu/record/81804', 'web'),
      R('Piaget, J., & Inhelder, B.', '1969', 'The Psychology of the Child', 'New York: Basic Books (ترجمة Helen Weaver)', 'https://search.worldcat.org/title/16142', 'web')
    ],
    vygotsky: [
      R('Vygotsky, L. S.', '1978', 'Mind in Society: The Development of Higher Psychological Processes', 'Cambridge, MA: Harvard University Press (تحرير M. Cole, V. John-Steiner, S. Scribner, E. Souberman)', 'https://search.worldcat.org/title/3517053', 'web'),
      R('Vygotsky, L. S.', '1962', 'Thought and Language', 'Cambridge, MA: MIT Press (ترجمة E. Hanfmann و G. Vakar؛ الأصل الروسي 1934)', 'https://libcat.library.tamu.edu/Record/in00003522803', 'web'),
      R('Wood, D., Bruner, J. S., & Ross, G.', '1976', 'The role of tutoring in problem solving', 'Journal of Child Psychology and Psychiatry, 17(2), 89-100', 'https://pubmed.ncbi.nlm.nih.gov/932126/', 'web', '10.1111/j.1469-7610.1976.tb00381.x')
    ],
    erikson: [
      R('Erikson, E. H.', '1950', 'Childhood and Society', 'New York: W. W. Norton', 'https://openlibrary.org/books/OL1194364W', 'web'),
      R('Erikson, E. H.', '1968', 'Identity: Youth and Crisis', 'New York: W. W. Norton', 'https://libcat.library.tamu.edu/Record/in00000340275', 'web', null, 'فهارس المكتبات بتكتب العنوان «Identity, youth, and crisis».')
    ],
    bronfenbrenner: [
      R('Bronfenbrenner, U.', '1979', 'The Ecology of Human Development: Experiments by Nature and Design', 'Cambridge, MA: Harvard University Press', 'https://search.worldcat.org/title/956656424', 'web'),
      R('Bronfenbrenner, U., & Morris, P. A.', '2006', 'The bioecological model of human development', 'الفصل 14 في Handbook of Child Psychology (الطبعة 6، المجلد 1)، Wiley، ص 793-828', 'https://en.wikipedia.org/wiki/Ecological_systems_theory', 'web', null, 'اتأكدنا من البيانات من قايمة مراجع ظهرت في البحث، مش من صفحة الناشر نفسها.')
    ],
    attachment: [
      R('Bowlby, J.', '1969', 'Attachment and Loss: Vol. 1. Attachment', 'London: Hogarth Press / New York: Basic Books', 'https://search.worldcat.org/title/31984', 'web'),
      R('Ainsworth, M. D. S., Blehar, M. C., Waters, E., & Wall, S.', '1978', 'Patterns of Attachment: A Psychological Study of the Strange Situation', 'Hillsdale, NJ: Lawrence Erlbaum Associates', 'https://search.worldcat.org/title/4194069', 'web', null, 'بعض صفحات الناشر الحالي بتكتب سنة 1979.')
    ],
    bandura: [
      R('Bandura, A.', '1977', 'Self-efficacy: Toward a unifying theory of behavioral change', 'Psychological Review, 84(2), 191-215', D('10.1037/0033-295X.84.2.191'), 'web', '10.1037/0033-295X.84.2.191'),
      R('Bandura, A.', '1986', 'Social Foundations of Thought and Action: A Social Cognitive Theory', 'Englewood Cliffs, NJ: Prentice-Hall', 'https://libcat.library.tamu.edu/Record/in00000381058', 'web')
    ],
    infoproc: [
      R('Miller, G. A.', '1956', 'The magical number seven, plus or minus two: Some limits on our capacity for processing information', 'Psychological Review, 63, 81-97', D('10.1037/h0043158'), 'web', '10.1037/h0043158'),
      R('Atkinson, R. C., & Shiffrin, R. M.', '1968', 'Human memory: A proposed system and its control processes', 'في K. W. Spence و J. T. Spence (محرران)، The Psychology of Learning and Motivation، المجلد 2، ص 89-195', 'https://researchr.org/publication/AtkinsonS68', 'web'),
      R('Craik, F. I. M., & Lockhart, R. S.', '1972', 'Levels of processing: A framework for memory research', 'Journal of Verbal Learning and Verbal Behavior, 11, 671-684', 'https://psych205.stanford.edu/papers/CraikLockhart72.pdf', 'web')
    ],
    baddeley: [
      R('Baddeley, A. D., & Hitch, G. J.', '1974', 'Working memory', 'في G. H. Bower (محرر)، The Psychology of Learning and Motivation، المجلد 8، Academic Press، ص 47-89', 'https://www.lancaster.ac.uk/fas/psych/glossary/model/working_memory', 'web'),
      R('Baddeley, A. D.', '2000', 'The episodic buffer: A new component of working memory?', 'Trends in Cognitive Sciences', 'https://pubmed.ncbi.nlm.nih.gov/11058819/', 'web')
    ],
    ef: [
      R('Miyake, A., Friedman, N. P., Emerson, M. J., Witzki, A. H., Howerter, A., & Wager, T. D.', '2000', 'The unity and diversity of executive functions and their contributions to complex "frontal lobe" tasks: A latent variable analysis', 'Cognitive Psychology, 41(1), 49-100', 'https://pubmed.ncbi.nlm.nih.gov/10945922/', 'web', '10.1006/cogp.1999.0734', 'نتيجة البحث أكدت العنوان والمجلة والصفحات والمؤلف الأول؛ أسماء باقي المؤلفين ما ظهرتش فيها.'),
      R('Diamond, A.', '2013', 'Executive functions', 'Annual Review of Psychology, 64, 135-168', D('10.1146/annurev-psych-113011-143750'), 'web', '10.1146/annurev-psych-113011-143750')
    ],
    cogload: [
      R('Sweller, J.', '1988', 'Cognitive load during problem solving: Effects on learning', 'Cognitive Science, 12(2), 257-285', D('10.1207/s15516709cog1202_4'), 'web', '10.1207/s15516709cog1202_4'),
      R('Sweller, J., van Merriënboer, J. J. G., & Paas, F. G. W. C.', '1998', 'Cognitive architecture and instructional design', 'Educational Psychology Review, 10, 251-296', D('10.1023/A:1022193728205'), 'web', '10.1023/A:1022193728205')
    ],
    sdt: [
      R('Deci, E. L., & Ryan, R. M.', '1985', 'Intrinsic Motivation and Self-Determination in Human Behavior', 'New York: Plenum Press (دلوقتي عند Springer)', D('10.1007/978-1-4899-2271-7'), 'web', '10.1007/978-1-4899-2271-7'),
      R('Ryan, R. M., & Deci, E. L.', '2000', 'Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being', 'American Psychologist, 55(1), 68-78', 'https://pubmed.ncbi.nlm.nih.gov/11392867/', 'web', '10.1037//0003-066x.55.1.68')
    ],
    srl: [
      R('Zimmerman, B. J.', '2000', 'Attaining self-regulation: A social cognitive perspective', 'الفصل 2 في M. Boekaerts, P. R. Pintrich, M. Zeidner (محررون)، Handbook of Self-Regulation، Academic Press', 'https://halshs.archives-ouvertes.fr/hal-00702963/', 'web', null, 'أرقام الصفحات ما اتأكدناش منها.'),
      R('Zimmerman, B. J.', '2002', 'Becoming a self-regulated learner: An overview', 'Theory Into Practice, 41(2), 64-70', D('10.1207/s15430421tip4102_2'), 'web', '10.1207/s15430421tip4102_2')
    ],
    mindset: [
      R('Dweck, C. S., & Leggett, E. L.', '1988', 'A social-cognitive approach to motivation and personality', 'Psychological Review, 95(2), 256-273', D('10.1037/0033-295X.95.2.256'), 'web', '10.1037/0033-295X.95.2.256'),
      R('Dweck, C. S.', '2006', 'Mindset: The New Psychology of Success', 'New York: Random House', 'https://openlibrary.org/books/OL8363726M', 'web')
    ],
    chc: [
      R('Cattell, R. B.', '1963', 'Theory of fluid and crystallized intelligence: A critical experiment', 'Journal of Educational Psychology, 54(1), 1-22', D('10.1037/h0046743'), 'web', '10.1037/h0046743'),
      R('Carroll, J. B.', '1993', 'Human Cognitive Abilities: A Survey of Factor-Analytic Studies', 'Cambridge University Press', D('10.1017/CBO9780511571312'), 'web', '10.1017/CBO9780511571312'),
      R('McGrew, K. S.', '2009', 'CHC theory and the human cognitive abilities project: Standing on the shoulders of the giants of psychometric intelligence research', 'Intelligence, 37, 1-10 (افتتاحية)', 'https://search.isc.ac/Inventory/10/2377109.htm', 'web')
    ],
    gardner: [
      R('Gardner, H.', '1983', 'Frames of Mind: The Theory of Multiple Intelligences', 'New York: Basic Books', 'https://pz.harvard.edu/resources/frames-of-mind-the-theory-of-multiple-intelligences', 'web')
    ],
    renzulli: [
      R('Renzulli, J. S.', '1978', 'What makes giftedness? Reexamining a definition', 'Phi Delta Kappan, 60(3), 180-184, 261', 'https://gifted.uconn.edu/schoolwide-enrichment-model/three-ring_conception_of_giftedness', 'web', null, 'فيه إعادة نشر سنة 2011 في نفس المجلة برقم DOI خاص بيها، مش بتاع الأصل.')
    ]
  };

  T.recent = {
    piaget: [
      E('نقد', 'Babakr, Z. H., et al.', '2019', 'Piaget\'s Cognitive Developmental Theory: Critical Review', 'Education Quarterly Reviews', 'w:568ab468-bde9-4f2d-833f-d32669e5aea0', 'مراجعة نقدية بتلخّص أشهر المآخذ: النظرية قلّلت من قدرات الرضّع، وبالغت في قدرات المراهقين، وأهملت دور الثقافة والتفاعل الاجتماعي. دي مراجعة سردية مش تحليل بعدي (حسب ملخص الدراسة).'),
      E('دراسة حالة', 'العويرضي، نافله محمد', '2022', 'Piaget\'s Theory of Cognitive Development: The Development of Conservation in the Concrete Operational Stage in Saudi Children', 'Al-Mağallah Al-Dawliyyaẗ Lil Taʿlim Al-Iliktirūnī', 'w:3398cac9-22e3-4d8f-b291-4c8a0eda65f9', 'دراسة حالة لطفل سعودي واحد عنده 8 سنين: نجح في احتفاظ العدد وما نجحش في الطول والسائل والكتلة والحجم. طفل واحد ما يتعمّمش منه أي حاجة (حسب ملخص الدراسة).', true)
    ],
    vygotsky: [
      E('تحليل بعدي', 'Belland, B. R., et al.', '2017', 'A Bayesian Network Meta-Analysis to Synthesize the Influence of Contexts of Scaffolding Use on Cognitive Outcomes in STEM Education', 'Review of Educational Research', 'w:231cb4f1-884f-4e2c-b9f8-8314b01f8ff6', 'تحليل بعدي لـ 56 دراسة عن السقالات المحوسبة في العلوم والرياضيات: تحسّن قبلي-بعدي قوي وثابت في أغلب السياقات. المقارنة قبل وبعد عند نفس الطلاب، مش ضد مجموعة ضابطة (حسب ملخص الدراسة).'),
      E('مراجعة منهجية', 'Dixon, C., et al.', '2022', 'Dynamic assessment as a predictor of reading development: a systematic review', 'Reading and Writing', 'w:986244dc-0e88-4305-8ac8-727db12f5b85', 'مراجعة لـ 18 دراسة: مقاييس التقييم الدينامي فسّرت جزء إضافي من نمو القراءة بعد حساب الاختبارات الثابتة (من 1% لـ 21% لدقة قراءة الكلمات)، ومفيش دراسة منها فحصت الأطفال متعددي اللغة والثقافة تحديداً (حسب ملخص الدراسة).'),
      E('تحليل بعدي', 'Wood, E. A., et al.', '2024', 'Dynamic Assessments of Word Reading Skills in Diverse School-Age Children: A Meta-Analysis', 'Perspectives of the ASHA Special Interest Groups', 'w:7961ce87-673e-4488-9dd3-3579068a8c2f', 'تحليل بعدي لـ 35 دراسة: التقييم الدينامي لمهارات قراءة الكلمات ارتبط بمقاييس القراءة بدرجة كويسة، وكان أنسب للأطفال من 4 لـ 7 سنين عن الأكبر. الباحثين وصفوا الأدلة بإنها أولية (حسب ملخص الدراسة).')
    ],
    erikson: [
      E('مراجعة', 'Branje, S., et al.', '2021', 'Dynamics of Identity Development in Adolescence: A Decade in Review', 'Journal of Research on Adolescence', 'w:6a7edc93-b5ec-4a35-b2af-0e9a7ea331b5', 'مراجعة لأبحاث 2010-2020: نمو الهوية في المراهقة وبداية الرشد فيه نضج منتظم وفيه كمان ثبات كبير، يعني مش «أزمة» حادة عند أغلب المراهقين (حسب ملخص الدراسة).'),
      E('دراسة طولية', 'Mitchell, L. L., et al.', '2021', 'Implications of identity resolution in emerging adulthood for intimacy, generativity, and integrity across the adult lifespan', 'Psychology and Aging', 'w:1da0d695-73e8-4c0d-ae9f-801a20eb76c8', 'متابعة 1224 شخص من العشرينات للستينات: اللي حسموا هويتهم بدري كانوا أعلى في الألفة والإنتاجية والتكامل، لكن اللي اتأخروا لحقوهم تقريباً على الستينات. دعم جزئي لترتيب المراحل، مع إن التأخير بيتعوّض (حسب ملخص الدراسة).'),
      E('مراجعة منهجية', 'Carvalho, N., et al.', '2022', 'Psychosocial Development Research in Adolescence: a Scoping Review', 'Trends in Psychology', 'w:6ce5a4a4-6ae3-490f-a693-1f9fbc586384', 'مراجعة استطلاعية لـ 58 دراسة (2011-2020): أغلب البحث مركّز على الهوية ومن أمريكا الشمالية وأوروبا، وبأدوات قياس كتير مختلفة (حسب ملخص الدراسة).'),
      E('مراجعة منهجية', 'Maehler, D. B., et al.', '2025', 'Identity development research: a systematic review of reviews', 'Self and Identity', 'w:045c2b1a-a1e5-4758-93b4-0ae606dace16', 'مراجعة لمراجعات بتغطي 909 دراسة كمّية عن الاستكشاف والالتزام: بتوثّق العلاقة بين نمو الهوية والتوافق النفسي، وبتشاور على فجوات منهجية في المجال (حسب ملخص الدراسة).')
    ],
    bronfenbrenner: [
      E('نقد', 'Tudge, J. R. H., et al.', '2016', 'Still Misused After All These Years? A Reevaluation of the Uses of Bronfenbrenner\'s Bioecological Theory of Human Development', 'Journal of Family Theory & Review', 'w:0207b310-3f10-4b50-9ae7-5eb421a1bf0d', 'من 20 بحث قالوا إنهم مبنيين على النظرية، اتنين بس وصفوا واختبروا مفاهيمها الأربعة (العملية، الشخص، السياق، الزمن) بشكل صحيح (حسب ملخص الدراسة).'),
      E('مراجعة', 'Navarro, J. L., et al.', '2022', 'Bored of the rings: Methodological and analytic approaches to operationalizing Bronfenbrenner\'s PPCT model in research practice', 'Journal of Family Theory & Review', 'w:eacf529b-0b10-4330-970d-9d70c8dffca2', 'دليل عملي بأمثلة من 8 دراسات (كمّية ونوعية) لإزاي نموذج PPCT يتحوّل لتصميم بحثي فعلي، بعد ما بيّن إن دراسات قليلة بتطبّقه بدقة (حسب ملخص الدراسة).'),
      E('مراجعة', 'Tong, P., & An, I. S.', '2024', 'Review of studies applying Bronfenbrenner\'s bioecological theory in international and intercultural education research', 'Frontiers in Psychology', 'w:842d1403-bec1-415f-b338-6c61c0cc0e55', 'أغلب الدراسات في المجال ده استخدمت النسخة القديمة من النظرية (الدواير) أو عرضت النموذج المتأخر بشكل ناقص، والعمليات القريبة نادراً ما اتدرست بعمق (حسب ملخص الدراسة).')
    ],
    attachment: [
      E('تحليل بعدي', 'Madigan, S., et al.', '2024', 'Maternal and paternal sensitivity: Key determinants of child attachment security examined through meta-analysis', 'Psychological Bulletin', 'w:90b9113c-b87c-454f-b523-a9eaef5b9ba1', 'تحليل بعدي لـ 174 دراسة (حوالي 23 ألف مشارك): ارتباط حساسية مقدّم الرعاية بأمان التعلّق r = .25، وحساسية الأب قريبة من حساسية الأم. علاقة ثابتة ومتوسطة الحجم (حسب ملخص الدراسة).'),
      E('تحليل بعدي', 'Zeegers, M. A. J., et al.', '2017', 'Mind matters: A meta-analysis on parental mentalization and sensitivity as predictors of infant-parent attachment', 'Psychological Bulletin', 'w:b9825480-0ce6-494f-8fef-b5d64a8bf6f8', 'الحساسية وفهم الأهل لحالة الرضيع الداخلية مع بعض فسّروا 12% بس من التباين في أمان التعلّق، يعني فيه عوامل كتير تانية (حسب ملخص الدراسة).'),
      E('تحليل بعدي', 'van IJzendoorn, M. H., et al.', '2022', 'Improving parenting, child attachment, and externalizing behaviors: Meta-analysis of the first 25 randomized controlled trials on the effects of VIPP-SD', 'Development and Psychopathology', 'w:ac9e886c-4454-41c5-8c6c-b06d16f40a67', '25 تجربة عشوائية لبرنامج تدريب بالفيديو لأكتر من 2000 أب وأم: أثر على سلوك الوالدين (r = .18) وعلى أمان تعلّق الطفل (r = .23)، ومفيش أثر واضح على مشاكل السلوك الخارجية (حسب ملخص الدراسة).'),
      E('مراجعة منهجية', 'Nivison, M. D., et al.', '2026', 'Annual Research Review: The role of caregiver sensitivity in children\'s developmental outcomes - an umbrella review', 'Journal of Child Psychology and Psychiatry', 'w:dbb7ba33-03ee-475a-86f0-8e336c30a280', 'مراجعة مظلّية لـ 17 تحليل بعدي: الحساسية مرتبطة بأمان التعلّق (r = .25) وبالمعرفة واللغة بدرجة متوسطة، وبالمشاكل الانفعالية الاجتماعية بدرجة ضعيفة (حسب ملخص الدراسة).')
    ],
    bandura: [
      E('تحليل بعدي', 'Talsma, K., et al.', '2018', 'I believe, therefore I achieve (and vice versa): A meta-analytic cross-lagged panel analysis of self-efficacy and academic performance', 'Learning and Individual Differences', 'w:8e923a8e-5591-4dcc-8d60-2385f4346545', 'تحليل بعدي لدراسات طولية: أثر الأداء على فاعلية الذات بعد كده (β = 0.205) أكبر من أثر الفاعلية على الأداء (β = 0.071)، وعند الأطفال ما ظهرش غير الاتجاه الأول (حسب ملخص الدراسة).'),
      E('تحليل بعدي', 'Vu, T., et al.', '2024', 'The reciprocity between various motivation constructs and academic achievement: a systematic review and multilevel meta-analysis of longitudinal studies', 'Educational Psychology', 'w:e10148e2-b8af-4b5c-b980-d37eb420d578', '47 دراسة طولية في الابتدائي والثانوي: أثر التحصيل على الدافعية تقريباً ضعف أثر الدافعية على التحصيل، وأثر الدافعية ظهر مع معتقدات الذات بس (حسب ملخص الدراسة).'),
      E('دراسة ارتباطية', 'Al-Abyadh, M. H. A., et al.', '2022', 'Academic Achievement: Influences of University Students\' Self-Management and Perceived Self-Efficacy', 'Journal of Intelligence', 'w:01d24c62-4e22-4cda-a650-ce4045382369', 'استبيان إلكتروني لـ 889 طالب جامعي من مصر والسعودية: فاعلية الذات وإدارة الذات ارتبطوا إيجابياً بالتحصيل، من غير فرق واضح بين البلدين. دراسة ارتباطية بتقرير ذاتي وما تثبتش سببية (حسب ملخص الدراسة).', true),
      E('دراسة قياس', 'Hemade, A., et al.', '2025', 'The 9-item Academic Self-Efficacy (ASE) scale: validity, reliability and measurement invariance across sexes and six Arab nations', 'Scientific Reports', 'w:b3a7c075-7764-4c4c-8042-e345815dd8c5', 'ترجمة عربية لمقياس فاعلية ذات أكاديمية من 9 بنود على 2131 طالب جامعي في 6 دول عربية منها مصر: بنية من عامل واحد وثبات عالي. العيّنة بطريقة كرة الثلج ومن طلاب جامعة بس (حسب ملخص الدراسة).', true)
    ],
    infoproc: [
      E('تحليل بعدي', 'Ruitenburg, S. K., et al.', '2026', 'A Meta-Analysis of the Effectiveness and Boundary Conditions of Retrieval Practice, Distributed Practice, and Interleaved Practice in Authentic School Classrooms', 'Educational Psychology Review', 'w:08a94097-7a5b-468e-b319-4fa0764eadcb', '53 دراسة في فصول ابتدائي وثانوي حقيقية: أثر التدريب على الاسترجاع g = 0.37، والتباعد g = 0.20، والتداخل g = 0.40، وكل واحد بيتوقف على شروط تنفيذه (حسب ملخص الدراسة).'),
      E('مراجعة منهجية', 'Agarwal, P. K., et al.', '2021', 'Retrieval Practice Consistently Benefits Student Learning: a Systematic Review of Applied Research in Schools and Classrooms', 'Educational Psychology Review', 'w:d75ede03-68ab-4a33-86db-d4049f68e80c', '50 تجربة في مدارس وفصول: 57% من أحجام الأثر متوسطة أو كبيرة لصالح الاسترجاع، لكن 6% بس من التجارب اتعملت برّه الدول الغربية الغنية (حسب ملخص الدراسة).'),
      E('تحليل بعدي', 'Adesope, O. O., et al.', '2017', 'Rethinking the Use of Tests: A Meta-Analysis of Practice Testing', 'Review of Educational Research', 'w:d2a0a0a6-14ad-4efd-a287-11d7ad86a2c2', 'الاختبارات التدريبية أفيد للتعلّم من إعادة المذاكرة ومن باقي ظروف المقارنة، وحجم الفايدة بيتغيّر بنوع الاختبار وخصائص الدراسة (حسب ملخص الدراسة).'),
      E('تحليل بعدي', 'Murray, E., et al.', '2025', 'A Meta-analytic Review of the Effectiveness of Spacing and Retrieval Practice for Mathematics Learning', 'Educational Psychology Review', 'w:2b4fe717-a922-423e-ac99-d4b24c00feb4', 'في الرياضيات تحديداً: أثر التباعد صغير لمتوسط وثابت (g = 0.28)، أما أثر الاسترجاع (g = 0.18) فمش مؤكد إحصائياً لقلة الدراسات (حسب ملخص الدراسة).')
    ],
    baddeley: [
      E('تحليل بعدي', 'Melby-Lervåg, M., et al.', '2016', 'Working Memory Training Does Not Improve Performance on Measures of Intelligence or Other Measures of "Far Transfer": Evidence From a Meta-Analytic Review', 'Perspectives on Psychological Science', 'w:2c4485cf-853c-4035-8bb5-d8d3f3e24e4a', '87 بحث: تدريب الذاكرة العاملة بيحسّن مهام ذاكرة شبه اللي اتدرّب عليها، ومفيش دليل مقنع على تحسّن في الذكاء أو القراءة أو الحساب لما المقارنة تبقى بمجموعة ضابطة نشِطة (حسب ملخص الدراسة).'),
      E('تحليل بعدي', 'Sala, G., et al.', '2019', 'Near and Far Transfer in Cognitive Training: A Second-Order Meta-Analysis', 'Collabra Psychology', 'w:4941143d-29fa-412c-b279-55095a7a004a', 'تحليل بعدي لتحليلات بعدية: فيه انتقال قريب لمهام الذاكرة، والانتقال البعيد صغير أو صفر، وبيساوي صفر بعد ضبط أثر التوقّع وتحيّز النشر (حسب ملخص الدراسة).'),
      E('تحليل بعدي', 'Sala, G., et al.', '2020', 'Working memory training in typically developing children: A multilevel meta-analysis', 'Psychonomic Bulletin & Review', 'w:9f367e41-9d58-44c3-abf5-f08738bcde9f', '41 دراسة على أطفال عاديين (2375 طفل): أثر صغير لمتوسط على مهام الذاكرة، والذكاء والتحصيل ما اتأثروش تقريباً مع مجموعات ضابطة نشِطة (حسب ملخص الدراسة).'),
      E('تحليل بعدي', 'Schwaighofer, M., et al.', '2015', 'Does Working Memory Training Transfer? A Meta-Analysis Including Training Conditions as Moderators', 'Educational Psychologist', 'w:4f2f4434-d99e-4f2b-92d8-9d4a970e196c', '47 دراسة: انتقال قريب واضح ومستمر، وانتقال بعيد صغير (g = 0.14 لـ 0.16) ما استمرش في المتابعة (حسب ملخص الدراسة).')
    ],
    ef: [
      E('مراجعة منهجية', 'Karr, J. E., et al.', '2018', 'The unity and diversity of executive functions: A systematic review and re-analysis of latent variable studies', 'Psychological Bulletin', 'w:36ff321d-9625-4b73-8e61-a97a44f8b294', 'إعادة تحليل 46 عيّنة (9756 مشارك): مفيش نموذج واحد ثبت في كل العيّنات. عند الأطفال والمراهقين النموذج الأحادي اتقبل أكتر، وعند الراشدين النموذج المتداخل اللي من غير عامل مستقل للكف (حسب ملخص الدراسة).'),
      E('مراجعة', 'Friedman, N. P., & Miyake, A.', '2017', 'Unity and diversity of executive functions: Individual differences as a window on cognitive structure', 'Cortex', 'w:9e05d63a-f29b-484d-a20d-9f32f6da6aeb', 'مراجعة من أصحاب الإطار: الوظائف التنفيذية مرتبطة بقوة لكن بتتفصل لما تتقاس بمتغيرات كامنة، ومش هي نفسها الذكاء العام، ووراثيتها عالية على المستوى الكامن (حسب ملخص الدراسة).'),
      E('تحليل بعدي', 'Kassai, R., et al.', '2019', 'A meta-analysis of the experimental evidence on the near- and far-transfer effects among children\'s executive function skills', 'Psychological Bulletin', 'w:5ed862b9-8f00-43d0-99f4-ea9a45965bf7', 'تدريب مكوّن تنفيذي عند الأطفال بيحسّن المكوّن نفسه (g = 0.44)، ومفيش دليل مقنع إنه بينتقل للمكوّنات اللي ما اتدرّبتش (g = 0.11، غير دال) (حسب ملخص الدراسة).'),
      E('نقد', 'Sambol, S., et al.', '2023', 'A true reflection of executive functioning or a representation of task-specific variance? Re-evaluating the unity/diversity framework', 'Acta Psychologica', 'w:012d29bc-9b10-42cf-afec-3a3bcaa6a1a3', 'في العيّنة دي لا النموذج التلاتي ولا المتداخل وصلوا لمطابقة مقبولة، والباحثين شايفين إن التحويل والكف ممكن يكونوا آليات خاصة بالمهام نفسها. دراسة واحدة (حسب ملخص الدراسة).')
    ],
    cogload: [
      E('مراجعة', 'Sweller, J., et al.', '2019', 'Cognitive Architecture and Instructional Design: 20 Years Later', 'Educational Psychology Review', 'w:1c4be440-05eb-4614-8bba-971684c32a53', 'أصحاب النظرية بيلخّصوا 20 سنة من الشغل النظري والتجريبي بعد بحث 1998 وبيرسموا اتجاهات البحث الجاية. مراجعة من أصحاب النظرية نفسهم (حسب ملخص الدراسة).'),
      E('تحليل بعدي', 'Krieglstein, F., et al.', '2022', 'A Systematic Meta-analysis of the Reliability and Validity of Subjective Cognitive Load Questionnaires in Experimental Multimedia Learning Research', 'Educational Psychology Review', 'w:6c5aae73-05dd-4e4c-8b5b-bddd9d5221c4', 'أربع استبيانات شايعة للحمل المعرفي: اتساقها الداخلي مُرضي، والارتباطات بين أنواع الحمل بتناقض جزئياً افتراضات النظرية، مع دعم عام لنموذج التلات أنواع (حسب ملخص الدراسة).'),
      E('دراسة قياس', 'Krieglstein, F., et al.', '2023', 'Development and Validation of a Theory-Based Questionnaire to Measure Different Types of Cognitive Load', 'Educational Psychology Review', 'w:81933600-710f-45e5-88dd-bd11e543e8a0', 'استبيان جديد اتبنى على 5 دراسات وطلع بثلاث مكوّنات واتساق مُرضي، والباحثين نفسهم بيقولوا إن الحمل وثيق الصلة لسه محل خلاف في قياسه ومكانه في النظرية (حسب ملخص الدراسة).'),
      E('نقد', 'Orrù, G., et al.', '2019', 'The Evolution of Cognitive Load Theory and the Measurement of Its Intrinsic, Extraneous and Germane Loads: A Review', 'Communications in Computer and Information Science', 'w:819fbda9-f80e-466f-874c-6279b239c6c8', 'أنواع الحمل التلاتة اتعاد تعريفها أكتر من مرة، ولسه مش واضح هل هي مستقلة وينفع تتجمع على بعض في مقياس واحد (حسب ملخص الدراسة).')
    ],
    sdt: [
      E('تحليل بعدي', 'Slemp, G. R., et al.', '2024', 'Interpersonal supports for basic psychological needs and their relations with motivation, well-being, and performance: A meta-analysis', 'Journal of Personality and Social Psychology', 'w:8472bce1-db1d-4060-bfa6-806658b2eadc', '881 عيّنة مستقلة (أكتر من 443 ألف مشارك): دعم الحاجات التلاتة مرتبط بقوة بإشباعها وبالرفاه، وبدرجة صغيرة لمتوسطة بالأداء، مع ثبات عام عبر الثقافات (حسب ملخص الدراسة).'),
      E('تحليل بعدي', 'Bureau, J. S., et al.', '2021', 'Pathways to Student Motivation: A Meta-Analysis of Antecedents of Autonomous and Controlled Motivations', 'Review of Educational Research', 'w:daaa428c-f708-47f8-acb1-306bc8cad0b2', '144 دراسة (أكتر من 79 ألف طالب): الكفاءة أقوى منبئ بالدافعية المستقلة، بعدها الاستقلال ثم الانتماء، ودعم المعلّم للاستقلال أقوى من دعم الأهل (حسب ملخص الدراسة).'),
      E('تحليل بعدي', 'Howard, J. L., et al.', '2024', 'Need Support and Need Thwarting: A Meta-Analysis of Autonomy, Competence, and Relatedness Supportive and Thwarting Behaviors in Student Populations', 'Personality and Social Psychology Bulletin', 'w:d37eedf5-df93-40cc-b60a-41c6240e646b', '637 عيّنة طلاب: سلوك المعلّم الداعم مرتبط بالأداء والاندماج والرفاه، والسلوك المُحبِط بالعكس. الباحثين سايبين سؤال مفتوح عن القيمة الإضافية لكل فئة لوحدها (حسب ملخص الدراسة).'),
      E('تحليل بعدي', 'Vasconcellos, D., et al.', '2020', 'Self-determination theory applied to physical education: A systematic review and meta-analysis', 'Journal of Educational Psychology', 'w:971b5e3b-426e-4229-8e79-4c4ce04322e5', '265 دراسة في التربية الرياضية: الدافعية المستقلة مرتبطة بالنتايج الإيجابية، والتنظيم الخارجي وانعدام الدافعية بالسلبية، زي ما النظرية بتتوقع. الأدلة ارتباطية (حسب ملخص الدراسة).')
    ],
    srl: [
      E('تحليل بعدي', 'Jansen, R. S., et al.', '2019', 'Self-regulated learning partially mediates the effect of self-regulated learning interventions on achievement in higher education: A meta-analysis', 'Educational Research Review', 'w:22be4a36-1784-4e76-a7ef-efe1a95c6b11', 'تدخلات التنظيم الذاتي في الجامعة حسّنت النشاط التنظيمي والتحصيل، لكن النشاط التنظيمي فسّر جزء بس من أثرها على التحصيل، وعوامل زي الوقت والدافعية ممكن يكون ليها دور (حسب ملخص الدراسة).'),
      E('تحليل بعدي', 'Xu, Z., et al.', '2022', 'A meta-analysis of the efficacy of self-regulated learning interventions on academic achievement in online and blended environments in K-12 and higher education', 'Behaviour and Information Technology', 'w:42caf694-481d-457c-82f7-2ba43b66f54e', 'في التعلّم الإلكتروني والمدمج: أثر إيجابي متوسط لتدخلات التنظيم الذاتي على التحصيل (ES = 0.69) في مراحل تعليمية مختلفة (حسب ملخص الدراسة).'),
      E('تحليل بعدي', 'Ruhl, J., et al.', '2025', 'Multimethod assessment of self-regulated learning in primary, secondary, and tertiary education - A meta-analysis', 'Learning and Individual Differences', 'w:c05828fa-2876-444d-b839-e5bc54c1a7f1', '20 بحث قاسوا التنظيم الذاتي بأكتر من أداة: الارتباط بين الأدوات ضعيف (حوالي r = .2 في أحسن الحالات)، يعني الاستبيان والملاحظة والتتبّع مش بيقيسوا نفس الحاجة (حسب ملخص الدراسة).'),
      E('تحليل بعدي', 'Li, J., et al.', '2018', 'What Are the Effects of Self-Regulation Phases and Strategies for Chinese Students? A Meta-Analysis of Two Decades Research of the Association Between Self-Regulation and Academic Performance', 'Frontiers in Psychology', 'w:53f5bfc9-4e3c-44c6-8b5c-cd103bfcd5ce', '59 دراسة على تلاميذ ابتدائي وثانوي في الصين (23497 مشارك) مبنية على أطوار زيمرمان: العلاقة الكلية بالتحصيل صغيرة، وأقوى الاستراتيجيات فاعلية الذات واستراتيجيات المهمة والتقييم الذاتي (حسب ملخص الدراسة).')
    ],
    mindset: [
      E('تحليل بعدي', 'Sisk, V. F., et al.', '2018', 'To What Extent and Under Which Circumstances Are Growth Mind-Sets Important to Academic Achievement? Two Meta-Analyses', 'Psychological Science', 'w:fa169f25-6db5-4d16-bed5-264950ca9808', 'تحليلين بعديين (273 دراسة للعلاقة، و43 للتدخلات): الأثر الكلي ضعيف في الاتنين، مع إشارة لإن الطلاب الأفقر أو المعرّضين للتعثر ممكن يستفيدوا (حسب ملخص الدراسة).'),
      E('تجربة كبيرة', 'Yeager, D. S., et al.', '2019', 'A national experiment reveals where a growth mindset improves achievement', 'Nature', 'w:621e6d88-bff9-4197-9181-825ec980be89', 'تدخّل إلكتروني أقل من ساعة على عيّنة ممثلة قومياً لطلاب الثانوي في أمريكا، بتحليلات مسجّلة مسبقاً: حسّن درجات الطلاب الأضعف تحصيلاً، والأثر ظهر لما أعراف الزملاء كانت ماشية مع رسالة التدخّل (حسب ملخص الدراسة).'),
      E('تحليل بعدي', 'Macnamara, B. N., & Burgoyne, A. P.', '2023', 'Do growth mindset interventions impact students\' academic achievement? A systematic review and meta-analysis with recommendations for best practices', 'Psychological Bulletin', 'w:fd1f98b7-97ec-4840-8568-ce88a75fb395', '63 دراسة (97672 مشارك): أثر كلي صغير جداً (d = 0.05) بيختفي بعد تصحيح تحيّز النشر، وفي أعلى الدراسات جودة d = 0.02 وغير دال. الباحثين رجّعوا الآثار الظاهرة لعيوب تصميم وتحيّز (حسب ملخص الدراسة).'),
      E('تحليل بعدي', 'Burnette, J. L., et al.', '2023', 'A systematic review and meta-analysis of growth mindset interventions: For whom, how, and why might such interventions work?', 'Psychological Bulletin', 'w:38e9fcad-6638-4ce0-970b-b083e8f7d5fc', '53 عيّنة مستقلة: مع الفئات المستهدفة والتطبيق الدقيق الأثر على التحصيل d = 0.14، ومدى التنبؤ من -0.08 لـ 0.35، يعني تفاوت كبير متوقع بين تطبيق وتاني (حسب ملخص الدراسة).')
    ],
    chc: [
      E('دراسة عاملية', 'Cucina, J. M., et al.', '2017', 'Woodcock-Johnson-III, Kaufman Adolescent and Adult Intelligence Test (KAIT), Kaufman Assessment Battery for Children (KABC), and Differential Ability Scales (DAS) support Carroll but not Cattell-Horn', 'Psychological Assessment', 'w:618ea9e7-e162-4dc9-9110-917848cc8a1d', 'في أربع بطاريات: دليل قوي على العامل العام، ومعاه من 3 لـ 9 قدرات عريضة مستقلة عنه، لكن ثبات درجات القدرات العريضة دي أقل من المطلوب (أقل من .80) (حسب ملخص الدراسة).'),
      E('دراسة عاملية', 'Dombrowski, S. C., et al.', '2017', 'Exploratory and hierarchical factor analysis of the WJ-IV Cognitive at school age', 'Psychological Assessment', 'w:36b4e304-affa-4f85-a202-bb12606132b0', 'التحليل الاستكشافي لعيّنة تقنين WJ-IV طلّع 4 عوامل مش الـ 7 اللي الناشر بيقترحهم، والعامل العام فسّر تباين أكتر من العوامل الأدنى (حسب ملخص الدراسة).'),
      E('نقد', 'Wasserman, J. D.', '2019', 'Deconstructing CHC', 'Applied Measurement in Education', 'w:2e8a715b-3f6f-402f-b575-c4c9f4d7f590', 'تعليق نقدي بيجمع المآخذ: قدرة تفسيرية ضعيفة، تنبؤات مش قابلة للاختبار، ارتباط ببطارية واحدة، تكرار غير ثابت للبنية، وقيمة غير مثبتة في تشخيص صعوبات التعلّم والتدخل معاها (حسب ملخص الدراسة).'),
      E('مراجعة', 'McGrew, K. S.', '2023', 'Carroll\'s Three-Stratum (3S) Cognitive Ability Theory at 30 Years: Impact, 3S-CHC Theory Clarification, Structural Replication, and Cognitive-Achievement Psychometric Network Analysis Extension', 'Journal of Intelligence', 'w:93f21181-9b4d-4eac-821d-42eb89ae9289', 'ماكجرو بيقترح إن نظريات كاتل وهورن وكارول تتشاف كـ«عيلة» نظريات مترابطة مش نظرية واحدة، وبيعرض تحليل بيدعم نموذج كارول الثلاثي (حسب ملخص الدراسة).')
    ],
    gardner: [
      E('نقد', 'Waterhouse, L.', '2023', 'Why multiple intelligences theory is a neuromyth', 'Frontiers in Psychology', 'w:1232790e-76d8-4356-b795-25115d91c641', 'مفيش باحث دوّر مباشرة عن أساس دماغي للذكاءات، والدراسات العاملية ما بيّنتش إنها مستقلة، ودراسات التدريس بيها ما ضبطتش التفسيرات البديلة. الخلاصة عندها: النظرية خرافة عصبية (حسب ملخص الدراسة).'),
      E('مراجعة', 'Shearer, C. B., et al.', '2017', 'The neuroscience of intelligence: Empirical support for the theory of multiple intelligences?', 'Trends in Neuroscience and Education', 'w:1b34a3ff-3d29-42fa-bb71-bc8beb343e33', 'رأي مؤيد: مراجعة لـ 318 تقرير عصبي بتقول إن كل ذكاء له «تماسك عصبي» مميز. المراجعة وصفية من مطوّر مقياس MIDAS، وما اختبرتش استقلال الذكاءات قياسياً (حسب ملخص الدراسة).'),
      E('نقد', 'Harb, H., et al.', '2025', 'Multiple Intelligences Theory and Educational Implications: A Critical Review', 'TEM Journal', 'w:861538d0-a4df-4b23-9e73-f667aff569f8', 'مراجعة نقدية: النظرية ما خدتش دعم تجريبي كافي ومفيش مقاييس موثوقة وصادقة لذكاءاتها، وجاردنر نفسه معترف بمحدودية القياس (حسب ملخص الدراسة).')
    ],
    renzulli: [
      E('تحليل بعدي', 'Hodges, J., et al.', '2018', 'A Meta-Analysis of Gifted and Talented Identification Practices', 'Gifted Child Quarterly', 'w:3a6d16fd-eff2-46c5-a188-9bdf69456a99', '54 دراسة أمريكية: طرق التعرّف غير التقليدية (ملفات إنجاز، قوايم، اختبارات غير لفظية) قلّلت فجوة تمثيل الفئات المهمّشة شوية (نسبة خطر 0.34 مقابل 0.27 للتقليدية) لكن ما قفلتهاش (حسب ملخص الدراسة).'),
      E('دراسة قياس', 'McCoach, D. B., et al.', '2024', 'Who Are We Measuring? Teacher Effects in Gifted and Talented Teacher Rating Scales', 'Exceptional Children', 'w:ef81c0c9-9e9a-4b17-94a8-070be813dcce', 'من 10% لـ 25% من درجة الطالب على مقاييس تقدير المعلّمين راجعة للمعلّم نفسه مش للطالب، فصعب تتحط درجة قطع عادلة بين معلّم وتاني (حسب ملخص الدراسة).'),
      E('مراجعة', 'Pigott, T., & Moon, S. M.', '2016', 'Introduction to the Meta-Analysis Special Issue', 'Gifted Child Quarterly', 'w:dde7426a-807d-4fce-8e05-1163f6ff2139', 'مقدمة عدد خاص بتلخّص تحليلين بعديين: برامج الإثراء (26 دراسة) ليها أثر إيجابي قوي على التحصيل ومتوسط على النمو الانفعالي الاجتماعي، ومقاييس الأداء والتقديرات بيتعرّفوا على أطفال مختلفين فالأفضل يتستخدموا مع بعض. ده تلخيص المقدمة مش البحثين الأصليين (حسب ملخص الدراسة).')
    ]
  };
})();
