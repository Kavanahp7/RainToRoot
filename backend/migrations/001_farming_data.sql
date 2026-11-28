-- Safe, additive migration for RainToRoot.
-- Fresh installations must create the `farmers` table first because these
-- tables reference farmers(id). Existing farmer records are preserved.
-- This migration creates only new tables and never drops or overwrites data.

CREATE TABLE IF NOT EXISTS soil_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    farmer_id INT NOT NULL,
    report_date DATE NOT NULL,
    source ENUM('laboratory', 'manual') NOT NULL DEFAULT 'manual',
    soil_type VARCHAR(100) NULL,
    ph DECIMAL(4,2) NULL,
    nitrogen DECIMAL(10,2) NULL,
    phosphorus DECIMAL(10,2) NULL,
    potassium DECIMAL(10,2) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_soil_reports_farmer FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE RESTRICT,
    INDEX idx_soil_reports_farmer_date (farmer_id, report_date DESC)
);

CREATE TABLE IF NOT EXISTS crop_recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    farmer_id INT NOT NULL,
    soil_report_id INT NULL,
    crop_name VARCHAR(100) NOT NULL,
    season VARCHAR(40) NOT NULL,
    reason TEXT NOT NULL,
    water_requirement VARCHAR(120) NULL,
    nutrient_requirement VARCHAR(180) NULL,
    growing_duration_days SMALLINT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_crop_recommendations_farmer FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_crop_recommendations_soil FOREIGN KEY (soil_report_id) REFERENCES soil_reports(id) ON DELETE SET NULL,
    INDEX idx_crop_recommendations_farmer_created (farmer_id, created_at DESC)
);

CREATE TABLE IF NOT EXISTS selected_crops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    farmer_id INT NOT NULL,
    recommendation_id INT NULL,
    crop_name VARCHAR(100) NOT NULL,
    season VARCHAR(40) NOT NULL,
    selected_on DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_selected_crops_farmer FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_selected_crops_recommendation FOREIGN KEY (recommendation_id) REFERENCES crop_recommendations(id) ON DELETE SET NULL,
    INDEX idx_selected_crops_farmer_active (farmer_id, is_active)
);

CREATE TABLE IF NOT EXISTS crop_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    farmer_id INT NOT NULL,
    selected_crop_id INT NULL,
    record_date DATE NOT NULL,
    growth_stage VARCHAR(100) NOT NULL,
    progress_percent TINYINT UNSIGNED NULL,
    irrigation_note TEXT NULL,
    nutrient_note TEXT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_crop_records_farmer FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_crop_records_crop FOREIGN KEY (selected_crop_id) REFERENCES selected_crops(id) ON DELETE SET NULL,
    INDEX idx_crop_records_farmer_date (farmer_id, record_date DESC)
);
