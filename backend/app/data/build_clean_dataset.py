import os
import re
import zipfile
import xml.etree.ElementTree as ET
import pandas as pd
import numpy as np

EXCEL_PATH = r"c:\Users\RAHUL\Downloads\overall data of both N & P.xlsx"
OUTPUT_CSV = r"c:\Users\RAHUL\Downloads\uti-ai-care-9b04a34e-main\backend\app\data\cleaned_clinical_uti_data.csv"

# Canonical drug mappings based on clinical / CLSI guidelines
ABX_MAP = {
    'amoxyclav': 'Amoxicillin-Clavulanate',
    'amoxicillin-clavulanate': 'Amoxicillin-Clavulanate',
    'amoxicillin-clavunate': 'Amoxicillin-Clavulanate',
    'amoxicillin-clavulnate': 'Amoxicillin-Clavulanate',
    'amoxicillin, clavulonicacid': 'Amoxicillin-Clavulanate',
    'amoxicillin/clavulanic acid': 'Amoxicillin-Clavulanate',
    'amoxicillin': 'Amoxicillin',
    'ampicillin': 'Ampicillin',
    'ampicilin': 'Ampicillin',
    'amikacin': 'Amikacin',
    'gentamicin': 'Gentamicin',
    'gentamycin': 'Gentamicin',
    'nitrofurantoin': 'Nitrofurantoin',
    'fosfomycin': 'Fosfomycin',
    'fosffomycin': 'Fosfomycin',
    'ceftriaxone': 'Ceftriaxone',
    'cefuroxime': 'Cefuroxime',
    'cefixime': 'Cefixime',
    'ceftazidime': 'Ceftazidime',
    'cefepime': 'Cefepime',
    'cefotaxime': 'Cefotaxime',
    'cefoxitin': 'Cefoxitin',
    'cefalotin': 'Cefalotin',
    'cefpodoxime': 'Cefpodoxime',
    'cefazolin': 'Cefazolin',
    'cefperazone-sulbactum': 'Cefoperazone-Sulbactam',
    'cefoperazone, sulbactum': 'Cefoperazone-Sulbactam',
    'cefoperazone-sulbactam': 'Cefoperazone-Sulbactam',
    'cefaperazone-sulbactum': 'Cefoperazone-Sulbactam',
    'cefperazone+sulbactum': 'Cefoperazone-Sulbactam',
    'piperacillin-tazobactum': 'Piperacillin-Tazobactam',
    'piperacillin-tazobactam': 'Piperacillin-Tazobactam',
    'piperacillin': 'Piperacillin',
    'ciprofloxacin': 'Ciprofloxacin',
    'ciproflaxacin': 'Ciprofloxacin',
    'levofloxacin': 'Levofloxacin',
    'ofloxacin': 'Ofloxacin',
    'norfloxacin': 'Norfloxacin',
    'nalidixic acid': 'Nalidixic Acid',
    'nalidixicacid': 'Nalidixic Acid',
    'co-trimoxazole': 'Co-trimoxazole',
    'cotrimoxazole': 'Co-trimoxazole',
    'cotrimaxazole': 'Co-trimoxazole',
    'co-trimaxole': 'Co-trimoxazole',
    'trimethoprim-sulfamethoxazole': 'Co-trimoxazole',
    'trimethoprimsulfamethoxazole': 'Co-trimoxazole',
    'meropenem': 'Meropenem',
    'imipenem': 'Imipenem',
    'ertapenem': 'Ertapenem',
    'doxycycline': 'Doxycycline',
    'doxycyclin': 'Doxycycline',
    'azithromycin': 'Azithromycin',
    'aztreonam': 'Aztreonam',
    'aztreonem': 'Aztreonam',
    'vancomycin': 'Vancomycin',
    'linezolid': 'Linezolid',
    'colistin': 'Colistin',
    'polymyxin-b': 'Colistin',
    'tigecycline': 'Tigecycline',
    'metronidazole': 'Metronidazole',
    'tetracycline': 'Tetracycline',
    'erythromycin': 'Erythromycin',
    'teicoplanin': 'Teicoplanin',
    'ceftazidine': 'Ceftazidime',
    'cefaperazone': 'Cefoperazone-Sulbactam',
    'cefaperazone+sulbactum': 'Cefoperazone-Sulbactam',
    'clavulanic acid': 'Amoxicillin-Clavulanate',
    'clavulanate': 'Amoxicillin-Clavulanate',
    'cefalexin': 'Cefalexin',
    # Class mappings for Sheet 3
    'quinolones': 'Ciprofloxacin',
    'fluoroquinolones': 'Ciprofloxacin',
    'cephalosporins': 'Ceftriaxone',
    'cephalosprins': 'Ceftriaxone',
    'macrolides': 'Azithromycin',
    'penicillins': 'Ampicillin',
    'extendedspectrumpenicillins': 'Piperacillin-Tazobactam',
    'aminoglycosides': 'Amikacin',
    'carbapenems': 'Meropenem',
}

PATHOGEN_MAP = {
    'e.coli': ('Escherichia coli', 'Gram Negative'),
    'e,coli': ('Escherichia coli', 'Gram Negative'),
    'escherichia coli': ('Escherichia coli', 'Gram Negative'),
    'escherichiacoli': ('Escherichia coli', 'Gram Negative'),
    'eschirichia coli': ('Escherichia coli', 'Gram Negative'),
    'klebsiella pneumoniae': ('Klebsiella pneumoniae', 'Gram Negative'),
    'klebsiella pneumonia': ('Klebsiella pneumoniae', 'Gram Negative'),
    'klebsiellapneumoniae': ('Klebsiella pneumoniae', 'Gram Negative'),
    'klebsellapneumoniae': ('Klebsiella pneumoniae', 'Gram Negative'),
    'klebsellapneumonia': ('Klebsiella pneumoniae', 'Gram Negative'),
    'klebsiella species': ('Klebsiella pneumoniae', 'Gram Negative'),
    'klenbsiella': ('Klebsiella pneumoniae', 'Gram Negative'),
    'klebsiella': ('Klebsiella pneumoniae', 'Gram Negative'),
    'pseudomonas aeruginosa': ('Pseudomonas aeruginosa', 'Gram Negative'),
    'pseudomonasa auruginosa': ('Pseudomonas aeruginosa', 'Gram Negative'),
    'pseudomonasaeruginosa': ('Pseudomonas aeruginosa', 'Gram Negative'),
    'pseudomonsaeruginosa': ('Pseudomonas aeruginosa', 'Gram Negative'),
    'pseudomonas species': ('Pseudomonas aeruginosa', 'Gram Negative'),
    'pseudomonas': ('Pseudomonas aeruginosa', 'Gram Negative'),
    'staphylococcus saprophyticus': ('Staphylococcus saprophyticus', 'Gram Positive'),
    'staphylococcus aureus': ('Staphylococcus aureus', 'Gram Positive'),
    'staphylococcusaureus': ('Staphylococcus aureus', 'Gram Positive'),
    'staphylococusaures': ('Staphylococcus aureus', 'Gram Positive'),
    'staphylococus pneumoniae': ('Streptococcus pneumoniae', 'Gram Positive'),
    'streptococcus pneumoniae': ('Streptococcus pneumoniae', 'Gram Positive'),
    'streptococcuspneumoniae': ('Streptococcus pneumoniae', 'Gram Positive'),
    'streptococcus.pneumoniae': ('Streptococcus pneumoniae', 'Gram Positive'),
    'enterococcus faecalis': ('Enterococcus faecalis', 'Gram Positive'),
    'enterococcus': ('Enterococcus faecalis', 'Gram Positive'),
    'enterobacter cloacae': ('Enterobacter cloacae', 'Gram Negative'),
    'enterobacter': ('Enterobacter cloacae', 'Gram Negative'),
    'streptococcus agalactiae': ('Streptococcus agalactiae', 'Gram Positive'),
    'acinetobacter baumannii': ('Acinetobacter baumannii', 'Gram Negative'),
    'acinetobacterbaumanii': ('Acinetobacter baumannii', 'Gram Negative'),
    'acinetobacter species': ('Acinetobacter baumannii', 'Gram Negative'),
    'acinetobacterspecies': ('Acinetobacter baumannii', 'Gram Negative'),
    'citrobacter freundii': ('Citrobacter freundii', 'Gram Negative'),
    'citrobacter species': ('Citrobacter freundii', 'Gram Negative'),
    'citrobacterspecies': ('Citrobacter freundii', 'Gram Negative'),
    'morganella morganii': ('Morganella morganii', 'Gram Negative'),
    'proteus mirabilis': ('Proteus mirabilis', 'Gram Negative'),
    'proteus vulgaris': ('Proteus vulgaris', 'Gram Negative'),
    'candida albicans': ('Candida albicans', 'Fungi'),
    'candida species isolated': ('Candida albicans', 'Fungi'),
    'candidaspecies': ('Candida albicans', 'Fungi'),
    'coagulase negative staphylococcus': ('Coagulase-negative Staphylococcus', 'Gram Positive'),
    'no bacterial growth': ('No Bacterial Growth', 'Unknown'),
    'nil': ('No Bacterial Growth', 'Unknown'),
}

def normalize_abx_list(raw_list):
    res = set()
    for item in raw_list:
        if not item or str(item).strip().lower() in ['nil', 'no', 'none', '']:
            continue
        parts = re.split(r'[,;\n/]+', str(item))
        for p in parts:
            p_clean = p.strip().lower()
            if not p_clean or p_clean in ['nil', 'no', 'none']:
                continue
            matched = ABX_MAP.get(p_clean)
            if not matched:
                for k, v in ABX_MAP.items():
                    if k in p_clean:
                        matched = v
                        break
            if matched:
                res.add(matched)
            elif len(p_clean) > 3 and not p_clean.isdigit():
                res.add(p.strip().title())
    return sorted(list(res))

def clean_range(val):
    if not val or str(val).strip().lower() in ['nil', 'none', 'nan', '']:
        return np.nan
    s = str(val).strip().lower().replace('/hpf', '').replace('hpf', '').replace(' ', '')
    if '-' in s:
        parts = s.split('-')
        try:
            return (float(parts[0]) + float(parts[1])) / 2.0
        except:
            pass
    try:
        matches = re.findall(r'\d+(?:\.\d+)?', s)
        if matches:
            return float(matches[0])
    except:
        pass
    return np.nan

def clean_protein(val):
    if not val or str(val).strip().lower() in ['nil', 'none', 'nan', 'negative', '']:
        return 'Negative'
    s = str(val).strip().lower()
    if 'trace' in s or 'tr' in s: return 'Trace'
    if '4' in s or '++++' in s: return '4+'
    if '3' in s or '+++' in s: return '3+'
    if '2' in s or '++' in s: return '2+'
    if '1' in s or '+' in s: return '1+'
    return 'Negative'

def clean_num(val):
    if not val or str(val).strip().lower() in ['nil', 'none', 'nan', '']:
        return np.nan
    s = str(val).strip()
    try:
        matches = re.findall(r'\d+(?:\.\d+)?', s)
        if matches:
            return float(matches[0])
    except:
        pass
    return np.nan

def clean_gender(val):
    s = str(val).strip().lower()
    if 'f' in s: return 'Female'
    if 'm' in s: return 'Male'
    return 'Female'

def clean_department(val):
    s = str(val).strip().lower()
    if 'nephro' in s: return 'Nephrology'
    if 'general med' in s or 'internal' in s or 'medicine' in s: return 'General Medicine'
    if 'obg' in s or 'gynecol' in s or 'obstet' in s: return 'Obstetrics & Gynecology'
    if 'pedia' in s or 'nicu' in s: return 'Pediatrics'
    if 'icu' in s: return 'ICU'
    if 'emerg' in s: return 'Emergency Medicine'
    if 'geriat' in s: return 'Geriatrics'
    if 'surg' in s: return 'General Surgery'
    if 'uro' in s: return 'Urology'
    if 'pulmo' in s: return 'Pulmonology'
    return 'General Medicine'

def clean_classification(val):
    s = str(val).strip().lower()
    if 'cauti' in s or 'catheter' in s: return 'Catheter-Associated UTI (CAUTI)'
    if 'hospital' in s or 'nosocomial' in s: return 'Hospital-Acquired UTI'
    if 'recurrent' in s: return 'Recurrent UTI'
    if 'uncomplicated' in s: return 'Uncomplicated UTI'
    if 'complicated' in s: return 'Complicated UTI'
    return 'Complicated UTI'

def clean_type_of_uti(val):
    s = str(val).strip().lower()
    if 'cystitis' in s or 'urethritis' in s or 'lower' in s: return 'Cystitis'
    if 'pyelo' in s or 'upper' in s: return 'Pyelonephritis'
    if 'urosepsis' in s or 'sepsis' in s: return 'Urosepsis'
    if 'asymptomatic' in s: return 'Asymptomatic Bacteriuria'
    return 'Cystitis'

def clean_site(val):
    s = str(val).strip().lower()
    if 'upper' in s: return 'Upper urinary tract'
    return 'Lower urinary tract'

def clean_sample(val):
    s = str(val).strip().lower()
    if 'urine' in s: return 'Urine'
    if 'blood' in s: return 'Blood'
    if 'pus' in s: return 'Pus'
    if 'sputum' in s: return 'Sputum'
    if 'swab' in s: return 'Swab'
    return 'Urine'

def build_dataset():
    with zipfile.ZipFile(EXCEL_PATH, 'r') as z:
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
            for si in tree.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
                t_elems = si.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')
                shared_strings.append(''.join([t.text for t in t_elems if t.text]))

        def parse_sheet_rows(s_name):
            tree = ET.fromstring(z.read(s_name))
            sheet_data = tree.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheetData')
            rows = sheet_data.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row')
            parsed = []
            for r in rows:
                row_dict = {}
                for c in r.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                    r_ref = c.get('r')
                    col_letters = ''.join([ch for ch in r_ref if ch.isalpha()])
                    t_attr = c.get('t')
                    v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                    val = ''
                    if v is not None and v.text:
                        if t_attr == 's':
                            idx = int(v.text)
                            val = shared_strings[idx] if idx < len(shared_strings) else ''
                        else:
                            val = v.text
                    row_dict[col_letters] = val.strip()
                parsed.append(row_dict)
            return parsed

        s1_rows = parse_sheet_rows('xl/worksheets/sheet1.xml')
        s2_rows = parse_sheet_rows('xl/worksheets/sheet2.xml')
        s3_rows = parse_sheet_rows('xl/worksheets/sheet3.xml')

    print(f"Parsing Sheet 2: Nephrology Data ({len(s2_rows)} rows)...")
    s2_records = []
    curr2 = None
    for r_idx in range(1, len(s2_rows)):
        row = s2_rows[r_idx]
        s_no = row.get('A', '')
        age = row.get('B', '')
        gender = row.get('C', '')
        is_new = False
        if s_no and (s_no.isdigit() or s_no.replace('.', '').isdigit()):
            is_new = True
        elif not s_no and age.isdigit() and gender.lower() in ['male', 'female', 'm', 'f']:
            is_new = True

        if is_new:
            if curr2: s2_records.append(curr2)
            curr2 = {
                'SOURCE': 'Sheet2_Nephrology',
                'AGE': clean_num(age),
                'GENDER': clean_gender(gender),
                'DEPARTMENT': clean_department(row.get('D', '')),
                'CHIEF_COMPLAINTS': row.get('E', '').strip(),
                'COMORBIDITIES': row.get('F', '').strip(),
                'RISKFACTORS': row.get('G', '').strip(),
                'SURGICAL_HISTORY': row.get('H', '').strip(),
                'SOCIAL_HISTORY': row.get('I', '').strip(),
                'DIAGNOSIS': row.get('J', '').strip(),
                'CLASSIFICATION_OF_UTI': clean_classification(row.get('K', '')),
                'TYPE_OF_UTI': clean_type_of_uti(row.get('L', '')),
                'SITE_OF_INFECTION': clean_site(row.get('M', '')),
                'TYPE_OF_SAMPLE': clean_sample(row.get('N', '')),
                'RAW_PATHOGEN': row.get('O', '').strip(),
                'RAW_BACTERIA': row.get('P', '').strip(),
                'RAW_RESISTANT': [row.get('Q')] if row.get('Q') else [],
                'RAW_PREV_ABX': [row.get('R')] if row.get('R') else [],
                'RAW_SENSITIVE': [row.get('S')] if row.get('S') else [],
                'CBP_LYMPHOCYTES': clean_num(row.get('AA', '')),
                'WBC': clean_num(row.get('AB', '')),
                'POLYMORPHS': clean_num(row.get('AC', '')),
                'CRP': clean_num(row.get('AD', '')),
                'RFT_SERUM_CREATININE': clean_num(row.get('AE', '')),
                'SERUM_URIC_ACID': clean_num(row.get('AF', '')),
                'BLOOD_UREA': clean_num(row.get('AG', '')),
                'CUE_PUS_CELLS': clean_range(row.get('AH', '')),
                'EPITHELIAL_CELLS': clean_range(row.get('AI', '')),
                'PROTEINS': clean_protein(row.get('AJ', '')),
                'RBC': clean_range(row.get('AK', ''))
            }
        else:
            if curr2:
                if row.get('Q'): curr2['RAW_RESISTANT'].append(row.get('Q'))
                if row.get('R'): curr2['RAW_PREV_ABX'].append(row.get('R'))
                if row.get('S'): curr2['RAW_SENSITIVE'].append(row.get('S'))
    if curr2: s2_records.append(curr2)
    print(f"Extracted {len(s2_records)} patients from Sheet 2.")

    # Parse Sheet 1
    print(f"Parsing Sheet 1: 30 Cases of Nephro ({len(s1_rows)} rows)...")
    s1_records = []
    curr1 = None
    for r_idx in range(1, len(s1_rows)):
        row = s1_rows[r_idx]
        s_no = row.get('A', '')
        age = row.get('C', '')
        gender = row.get('D', '')
        is_new = False
        if s_no and (s_no.isdigit() or s_no.replace('.', '').isdigit()):
            is_new = True
        elif not s_no and age.isdigit() and gender.upper() in ['M', 'F', 'MALE', 'FEMALE']:
            is_new = True

        if is_new:
            if curr1: s1_records.append(curr1)
            curr1 = {
                'SOURCE': 'Sheet1_30Cases',
                'AGE': clean_num(age),
                'GENDER': clean_gender(gender),
                'DEPARTMENT': clean_department(row.get('E', '')),
                'CHIEF_COMPLAINTS': row.get('F', '').strip(),
                'COMORBIDITIES': row.get('G', '').strip(),
                'RISKFACTORS': row.get('H', '').strip(),
                'SURGICAL_HISTORY': '',
                'SOCIAL_HISTORY': '',
                'DIAGNOSIS': row.get('S', '').strip() or 'UTI',
                'CLASSIFICATION_OF_UTI': 'Complicated UTI' if str(row.get('T', '')).upper() == 'YES' else 'Uncomplicated UTI',
                'TYPE_OF_UTI': clean_type_of_uti(row.get('I', '')),
                'SITE_OF_INFECTION': 'Upper urinary tract' if 'pyelo' in str(row.get('I', '')).lower() else 'Lower urinary tract',
                'TYPE_OF_SAMPLE': clean_sample(row.get('J', '')),
                'RAW_PATHOGEN': row.get('K', '').strip(),
                'RAW_BACTERIA': '',
                'RAW_RESISTANT': [row.get('L')] if row.get('L') else [],
                'RAW_PREV_ABX': [],
                'RAW_SENSITIVE': [row.get('M')] if row.get('M') else [],
                'CBP_LYMPHOCYTES': np.nan,
                'WBC': np.nan,
                'POLYMORPHS': np.nan,
                'CRP': np.nan,
                'RFT_SERUM_CREATININE': np.nan,
                'SERUM_URIC_ACID': np.nan,
                'BLOOD_UREA': np.nan,
                'CUE_PUS_CELLS': np.nan,
                'EPITHELIAL_CELLS': np.nan,
                'PROTEINS': 'Negative',
                'RBC': np.nan
            }
        else:
            if curr1:
                if row.get('L'): curr1['RAW_RESISTANT'].append(row.get('L'))
                if row.get('M'): curr1['RAW_SENSITIVE'].append(row.get('M'))
    if curr1: s1_records.append(curr1)
    print(f"Extracted {len(s1_records)} patients from Sheet 1.")

    # Parse Sheet 3: Over All Hospital Data
    print(f"Parsing Sheet 3: Over All Hospital Data ({len(s3_rows)} rows)...")
    s3_records = []
    # Sheet 3 has 1 row per patient
    for r_idx in range(1, len(s3_rows)):
        row = s3_rows[r_idx]
        p_id = row.get('A', '')
        age = row.get('B', '')
        gender = row.get('C', '')
        if not age or not (clean_num(age) > 0):
            continue

        raw_sample = row.get('H', '')
        raw_organism = row.get('K', '')
        raw_res = row.get('L', '')
        empirical = row.get('M', '')
        change_abx = row.get('N', '')
        prev_abx = row.get('I', '')

        # Build sensitive list from empirical + change
        sens_items = []
        if empirical and empirical.lower() != 'nil': sens_items.append(empirical)
        if change_abx and change_abx.lower() != 'nil': sens_items.append(change_abx)

        diagnosis = row.get('E', '').strip()
        is_uti = 'uti' in diagnosis.lower() or 'urine' in raw_sample.lower()
        
        s3_records.append({
            'SOURCE': 'Sheet3_OverAll',
            'AGE': clean_num(age),
            'GENDER': clean_gender(gender),
            'DEPARTMENT': clean_department(row.get('D', '')),
            'CHIEF_COMPLAINTS': diagnosis,
            'COMORBIDITIES': row.get('F', '').strip(),
            'RISKFACTORS': row.get('G', '').strip(),
            'SURGICAL_HISTORY': '',
            'SOCIAL_HISTORY': '',
            'DIAGNOSIS': diagnosis or ('Complicated UTI' if is_uti else 'Hospital Infection'),
            'CLASSIFICATION_OF_UTI': 'Complicated UTI' if is_uti else 'Hospital-Acquired Infection',
            'TYPE_OF_UTI': clean_type_of_uti(diagnosis) if is_uti else 'Systemic / Respiratory',
            'SITE_OF_INFECTION': 'Urinary tract' if is_uti else ('Respiratory tract' if 'sputum' in raw_sample.lower() else 'Systemic'),
            'TYPE_OF_SAMPLE': clean_sample(raw_sample),
            'RAW_PATHOGEN': raw_organism,
            'RAW_BACTERIA': '',
            'RAW_RESISTANT': [raw_res] if raw_res else [],
            'RAW_PREV_ABX': [prev_abx] if prev_abx else [],
            'RAW_SENSITIVE': sens_items,
            'CBP_LYMPHOCYTES': np.nan,
            'WBC': clean_num(row.get('O', '')),
            'POLYMORPHS': np.nan,
            'CRP': np.nan,
            'RFT_SERUM_CREATININE': clean_num(row.get('Y', '')),
            'SERUM_URIC_ACID': clean_num(row.get('Z', '')),
            'BLOOD_UREA': clean_num(row.get('X', '')),
            'CUE_PUS_CELLS': np.nan,
            'EPITHELIAL_CELLS': np.nan,
            'PROTEINS': clean_protein(row.get('V', '')),
            'RBC': np.nan
        })
    print(f"Extracted {len(s3_records)} patients from Sheet 3.")

    all_records = s2_records + s1_records + s3_records
    print(f"\nTotal combined clinical records across all 3 sheets: {len(all_records)}")

    # Standardize Pathogens, Bacteria, and Antibiotic lists
    final_rows = []
    for r in all_records:
        res_list = normalize_abx_list(r['RAW_RESISTANT'])
        sens_list = normalize_abx_list(r['RAW_SENSITIVE'])
        prev_list = normalize_abx_list(r['RAW_PREV_ABX'])

        # Mutual exclusivity: Resistant supersedes Sensitive
        clean_sens = [abx for abx in sens_list if abx not in res_list]

        # Pathogen resolution
        raw_pat = (r['RAW_PATHOGEN'] or '').lower().replace(' ', '').replace('.', '').replace('_', '').strip()
        raw_bac = (r['RAW_BACTERIA'] or '').lower().strip()

        pat_name, bac_type = None, None
        for k, (name, btype) in PATHOGEN_MAP.items():
            k_clean = k.replace(' ', '').replace('.', '').replace('_', '')
            if k_clean in raw_pat and k != 'nil':
                pat_name, bac_type = name, btype
                break

        if not pat_name:
            if not res_list and not clean_sens and (not r['RAW_PATHOGEN'] or 'nil' in r['RAW_PATHOGEN'].lower() or 'no' in r['RAW_PATHOGEN'].lower()):
                pat_name = 'No Bacterial Growth'
                bac_type = 'Unknown'
            else:
                if 'streptococc' in raw_pat or 'staphylococc' in raw_pat or 'positive' in raw_bac:
                    pat_name = 'Unspecified Gram-Positive Cocci'
                    bac_type = 'Gram Positive'
                elif 'coli' in raw_pat or 'klebs' in raw_pat or 'pseudom' in raw_pat or 'negative' in raw_bac:
                    pat_name = 'Unspecified Gram-Negative Bacilli'
                    bac_type = 'Gram Negative'
                elif pat_name is None and r['RAW_PATHOGEN']:
                    pat_name = r['RAW_PATHOGEN'].strip().title()
                    bac_type = 'Gram Negative'

        if 'positive' in raw_bac:
            bac_type = 'Gram Positive'
        elif 'negative' in raw_bac:
            bac_type = 'Gram Negative'

        final_rows.append({
            'AGE': r['AGE'],
            'GENDER': r['GENDER'],
            'DEPARTMENT': r['DEPARTMENT'],
            'CHIEF_COMPLAINTS': r['CHIEF_COMPLAINTS'],
            'COMORBIDITIES': r['COMORBIDITIES'],
            'RISKFACTORS': r['RISKFACTORS'],
            'SURGICAL_HISTORY': r['SURGICAL_HISTORY'],
            'SOCIAL_HISTORY': r['SOCIAL_HISTORY'],
            'DIAGNOSIS': r['DIAGNOSIS'],
            'CLASSIFICATION_OF_UTI': r['CLASSIFICATION_OF_UTI'],
            'TYPE_OF_UTI': r['TYPE_OF_UTI'],
            'SITE_OF_INFECTION': r['SITE_OF_INFECTION'],
            'TYPE_OF_SAMPLE': r['TYPE_OF_SAMPLE'],
            'ORGANISM_NAME': pat_name,
            'TYPE_OF_BACTERIA': bac_type,
            'RESISTANT': ';'.join(res_list),
            'PREVIOUS_ANTIBIOTIC_USED': ';'.join(prev_list),
            'SENSITIVE': ';'.join(clean_sens),
            'CBP_LYMPHOCYTES': r['CBP_LYMPHOCYTES'],
            'WBC': r['WBC'],
            'POLYMORPHS': r['POLYMORPHS'],
            'CRP': r['CRP'],
            'RFT_SERUM_CREATININE': r['RFT_SERUM_CREATININE'],
            'SERUM_URIC_ACID': r['SERUM_URIC_ACID'],
            'BLOOD_UREA': r['BLOOD_UREA'],
            'CUE_PUS_CELLS': r['CUE_PUS_CELLS'],
            'EPITHELIAL_CELLS': r['EPITHELIAL_CELLS'],
            'PROTEINS': r['PROTEINS'],
            'RBC': r['RBC']
        })

    df = pd.DataFrame(final_rows)
    print(f"\nFinal combined cleaned dataset shape: {df.shape}")
    print(f"Bacteria distribution:\n{df['TYPE_OF_BACTERIA'].value_counts(dropna=False)}")
    print(f"\nTop 10 Organisms:\n{df['ORGANISM_NAME'].value_counts(dropna=False).head(10)}")

    has_res = (df['RESISTANT'].str.len() > 0).sum()
    has_sens = (df['SENSITIVE'].str.len() > 0).sum()
    print(f"\nPatients with resistant profile: {has_res}/{len(df)}")
    print(f"Patients with sensitive profile: {has_sens}/{len(df)}")

    df.to_csv(OUTPUT_CSV, index=False)
    print(f"Saved merged dataset to: {OUTPUT_CSV}")

if __name__ == '__main__':
    build_dataset()
