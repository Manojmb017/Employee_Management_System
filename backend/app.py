
from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from datetime import date, datetime
from flask_bcrypt import Bcrypt
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity
)
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = os.environ["JWT_SECRET_KEY"]

bcrypt = Bcrypt(app)
jwt = JWTManager(app)
CORS(app)


# ---------------- DATABASE CONNECTION ----------------


import os
import mysql.connector

def get_connection():
    return mysql.connector.connect(
        host=os.environ["TIDB_HOST"],
        port=int(os.environ.get("TIDB_PORT", "4000")),
        user=os.environ["TIDB_USER"],
        password=os.environ["TIDB_PASSWORD"],
        database="hr_management",
        ssl_ca=os.environ["TIDB_CA"],
        ssl_verify_cert=True
    )


# ---------------- HELPER FUNCTIONS ----------------

def convert_date(value):
    """Convert an empty date to None and keep valid dates."""
    if not value:
        return None
    return value



def employee_to_dict(row):
    """Convert database column names to frontend field names."""
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "department": row["department"],
        "role": row["role"],
        "batch": row["batch"],
        "joiningDate": str(row["joining_date"]) if row["joining_date"] else "",
        "status": row["status"],
        "phone": row["phone"],
        "offerStatus": row["offer_status"],
        "offerAcceptanceDate": str(row["offer_acceptance_date"]) if row["offer_acceptance_date"] else "",
        "documentCollectionStatus": row["document_collection_status"] or "Pending",
        "documentStatus": row["document_status"],
        "backgroundCheckStatus": row["background_check_status"],
        "joiningConfirmation": row["joining_confirmation"],
        "workLocation": row["work_location"],
        "reportingManager": row["reporting_manager"],
        "onboardingStatus": row["onboarding_status"] or "Pending",
        "joiningCompleted": bool(row["joining_completed"]),
        "employeeIdCreated": bool(row["employee_id_created"]),
        "documentVerified": bool(row["document_verified"]),
        "equipmentStatus": row["equipment_status"],
        "emailAccessStatus": row["email_access_status"] or "Pending",
        "systemAccessStatus": row["system_access_status"],
        "inductionStatus": row["induction_status"],
        "policyAcknowledgement": bool(row["policy_acknowledgement"]),
        "trainingStatus": row["training_status"],
        "mentor": row["mentor"],
        "probationStartDate": str(row["probation_start_date"]) if row["probation_start_date"] else "",
        "probationEndDate": str(row["probation_end_date"]) if row["probation_end_date"] else "",
        "probationStatus": row["probation_status"],
        "feedback": row["feedback"],
        "performanceReviewStatus": row["performance_review_status"],
        "configurationStatus": row["configuration_status"] or "Pending"
    }


# ---------------- GET ALL EMPLOYEES ----------------

@app.route("/api/employees", methods=["GET"])
@jwt_required()
def get_employees():
    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    cursor.execute("SELECT * FROM employees ORDER BY id DESC")
    rows = cursor.fetchall()

    employees = [employee_to_dict(row) for row in rows]

    cursor.close()
    connection.close()

    return jsonify(employees)



# ---------------- ADD EMPLOYEE ----------------

@app.route("/api/employees", methods=["POST"])
@jwt_required()
def add_employee():
    data = request.get_json()

    if not data:
        return jsonify({"error": "No employee data received"}), 400

    required_fields = ["name", "email"]

    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    query = """
        INSERT INTO employees (
            name, email, department, role, batch, joining_date, status,
            phone, offer_status, offer_acceptance_date,
            document_collection_status, document_status,
            background_check_status, joining_confirmation,
            work_location, reporting_manager, onboarding_status,
            joining_completed, employee_id_created, document_verified,
            equipment_status, email_access_status, system_access_status,
            induction_status, policy_acknowledgement, training_status,
            mentor, probation_start_date, probation_end_date,
            probation_status, feedback, performance_review_status,
            configuration_status
        )
        VALUES (
            %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s
        )
    """

    values = (
        data.get("name"),
        data.get("email"),
        data.get("department"),
        data.get("role"),
        data.get("batch"),
        convert_date(data.get("joiningDate")),
        data.get("status", "Pre-Onboarding"),
        data.get("phone"),
        data.get("offerStatus", "Pending"),
        convert_date(data.get("offerAcceptanceDate")),
        data.get("documentCollectionStatus", "Pending"),
        data.get("documentStatus", "Pending"),
        data.get("backgroundCheckStatus", "Not Started"),
        data.get("joiningConfirmation", "Pending"),
        data.get("workLocation"),
        data.get("reportingManager"),
        data.get("onboardingStatus", "Pending"),
        data.get("joiningCompleted", False),
        data.get("employeeIdCreated", False),
        data.get("documentVerified", False),
        data.get("equipmentStatus", "Pending"),
        data.get("emailAccessStatus", "Pending"),
        data.get("systemAccessStatus", "Pending"),
        data.get("inductionStatus", "Pending"),
        data.get("policyAcknowledgement", False),
        data.get("trainingStatus", "Not Started"),
        data.get("mentor"),
        convert_date(data.get("probationStartDate")),
        convert_date(data.get("probationEndDate")),
        data.get("probationStatus", "In Progress"),
        data.get("feedback"),
        data.get("performanceReviewStatus", "Pending"),
        data.get("configurationStatus", "Pending")
    )

    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute(query, values)
        connection.commit()
        new_id = cursor.lastrowid

        return jsonify({
            "message": "Employee added successfully",
            "id": new_id
        }), 201

    except mysql.connector.IntegrityError:
        return jsonify({"error": "This email already exists"}), 409

    finally:
        cursor.close()
        connection.close()



# ---------------- UPDATE EMPLOYEE ----------------

@app.route("/api/employees/<int:employee_id>", methods=["PUT"])
@jwt_required()
def update_employee(employee_id):
    data = request.get_json()

    if not data:
        return jsonify({"error": "No employee data received"}), 400

    query = """
        UPDATE employees SET
            name = %s,
            email = %s,
            department = %s,
            role = %s,
            batch = %s,
            joining_date = %s,
            status = %s,
            phone = %s,
            offer_status = %s,
            offer_acceptance_date = %s,
            document_collection_status = %s,
            document_status = %s,
            background_check_status = %s,
            joining_confirmation = %s,
            work_location = %s,
            reporting_manager = %s,
            onboarding_status = %s,
            joining_completed = %s,
            employee_id_created = %s,
            document_verified = %s,
            equipment_status = %s,
            email_access_status = %s,
            system_access_status = %s,
            induction_status = %s,
            policy_acknowledgement = %s,
            training_status = %s,
            mentor = %s,
            probation_start_date = %s,
            probation_end_date = %s,
            probation_status = %s,
            feedback = %s,
            performance_review_status = %s,
            configuration_status = %s
        WHERE id = %s
    """

    values = (
        data.get("name"),
        data.get("email"),
        data.get("department"),
        data.get("role"),
        data.get("batch"),
        convert_date(data.get("joiningDate")),
        data.get("status", "Pre-Onboarding"),
        data.get("phone"),
        data.get("offerStatus", "Pending"),
        convert_date(data.get("offerAcceptanceDate")),
        data.get("documentCollectionStatus", "Pending"),
        data.get("documentStatus", "Pending"),
        data.get("backgroundCheckStatus", "Not Started"),
        data.get("joiningConfirmation", "Pending"),
        data.get("workLocation"),
        data.get("reportingManager"),
        data.get("onboardingStatus", "Pending"),
        data.get("joiningCompleted", False),
        data.get("employeeIdCreated", False),
        data.get("documentVerified", False),
        data.get("equipmentStatus", "Pending"),
        data.get("emailAccessStatus", "Pending"),
        data.get("systemAccessStatus", "Pending"),
        data.get("inductionStatus", "Pending"),
        data.get("policyAcknowledgement", False),
        data.get("trainingStatus", "Not Started"),
        data.get("mentor"),
        convert_date(data.get("probationStartDate")),
        convert_date(data.get("probationEndDate")),
        data.get("probationStatus", "In Progress"),
        data.get("feedback"),
        data.get("performanceReviewStatus", "Pending"),
        data.get("configurationStatus", "Pending"),
        employee_id
    )

    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute(query, values)
        connection.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "Employee not found"}), 404

        return jsonify({"message": "Employee updated successfully"})

    except mysql.connector.IntegrityError:
        return jsonify({"error": "This email already exists"}), 409

    finally:
        cursor.close()
        connection.close()



# ---------------- DELETE EMPLOYEE ----------------

@app.route("/api/employees/<int:employee_id>", methods=["DELETE"])
@jwt_required()
def delete_employee(employee_id):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        "DELETE FROM employees WHERE id = %s",
        (employee_id,)
    )
    connection.commit()

    deleted = cursor.rowcount

    cursor.close()
    connection.close()

    if deleted == 0:
        return jsonify({"error": "Employee not found"}), 404

    return jsonify({"message": "Employee deleted successfully"})


# ---------------- HR REGISTRATION ----------------

@app.route("/api/register", methods=["POST"])
def register_hr():
    data = request.get_json()

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        return jsonify({"message": "All fields are required"}), 400

    if len(password) < 8:
        return jsonify({"message": "Password must be at least 8 characters"}), 400

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            "SELECT id FROM hr_users WHERE email = %s",
            (email,)
        )

        if cursor.fetchone():
            return jsonify({"message": "Email already registered"}), 409

        password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

        cursor.execute(
            """
            INSERT INTO hr_users (name, email, password_hash)
            VALUES (%s, %s, %s)
            """,
            (name, email, password_hash)
        )

        connection.commit()

        return jsonify({"message": "HR registered successfully"}), 201

    except mysql.connector.Error as error:
        connection.rollback()
        return jsonify({"message": "Registration failed"}), 500

    finally:
        cursor.close()
        connection.close()

        # ---------------- TEST API ----------------

@app.route("/api/test", methods=["GET"])
def test_api():
    return jsonify({"message": "Flask API is working"})

# ---------------- HR LOGIN ----------------

@app.route("/api/login", methods=["POST"])
def login_hr():
    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            "SELECT * FROM hr_users WHERE email = %s",
            (email,)
        )

        hr_user = cursor.fetchone()

        if not hr_user:
            return jsonify({"message": "Invalid email or password"}), 401

        if not bcrypt.check_password_hash(
            hr_user["password_hash"], password
        ):
            return jsonify({"message": "Invalid email or password"}), 401

        access_token = create_access_token(
            identity=str(hr_user["id"])
        )

        return jsonify({
            "message": "Login successful",
            "access_token": access_token,
            "user": {
                "id": hr_user["id"],
                "name": hr_user["name"],
                "email": hr_user["email"]
            }
        }), 200

    finally:
        cursor.close()
        connection.close()

# ---------------- RUN SERVER ----------------

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=False)