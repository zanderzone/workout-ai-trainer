interface FormData {
  // User Information
  firstName: string;
  lastName: string;
  displayName: string;
  profilePicture?: string;

  // Fitness Profile Information
  ageRange: "18-24" | "25-34" | "35-44" | "45-54" | "55+";
  sex: "male" | "female" | "other";
  fitnessLevel: "beginner" | "intermediate" | "advanced";
  goals: Array<"weight loss" | "muscle gain" | "strength" | "endurance" | "power" | "flexibility" | "general fitness">;
  injuriesOrLimitations: string[];
  availableEquipment: string[];
  preferredTrainingDays: Array<"Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday">;
  preferredWorkoutDuration: "short" | "medium" | "long";
  locationPreference: "gym" | "home" | "park" | "indoor" | "outdoor" | "both";
}

const FITNESS_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

const FITNESS_GOALS = [
  { value: "weight loss", label: "Weight Loss" },
  { value: "muscle gain", label: "Muscle Gain" },
  { value: "strength", label: "Strength" },
  { value: "endurance", label: "Endurance" },
  { value: "power", label: "Power" },
  { value: "flexibility", label: "Flexibility" },
  { value: "general fitness", label: "General Fitness" },
] as const;

const AGE_RANGES = [
  { value: "18-24", label: "18-24" },
  { value: "25-34", label: "25-34" },
  { value: "35-44", label: "35-44" },
  { value: "45-54", label: "45-54" },
  { value: "55+", label: "55+" },
] as const;

const SEX_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
] as const;

const WORKOUT_DURATIONS = [
  { value: "short", label: "Short (15-30 min)" },
  { value: "medium", label: "Medium (30-60 min)" },
  { value: "long", label: "Long (60+ min)" },
] as const;

const LOCATION_PREFERENCES = [
  { value: "gym", label: "Gym" },
  { value: "home", label: "Home" },
  { value: "park", label: "Park" },
  { value: "indoor", label: "Indoor" },
  { value: "outdoor", label: "Outdoor" },
  { value: "both", label: "Both" },
] as const;

const WEEKDAYS = [
  { value: "Monday", label: "Monday" },
  { value: "Tuesday", label: "Tuesday" },
  { value: "Wednesday", label: "Wednesday" },
  { value: "Thursday", label: "Thursday" },
  { value: "Friday", label: "Friday" },
  { value: "Saturday", label: "Saturday" },
  { value: "Sunday", label: "Sunday" },
] as const;

const EQUIPMENT_OPTIONS = [
  { value: "bodyweight", label: "Bodyweight Only" },
  { value: "dumbbells", label: "Dumbbells" },
  { value: "resistance_bands", label: "Resistance Bands" },
  { value: "pull_up_bar", label: "Pull-up Bar" },
  { value: "kettlebells", label: "Kettlebells" },
  { value: "barbell", label: "Barbell" },
  { value: "gym_machines", label: "Gym Machines" },
  { value: "cardio_machines", label: "Cardio Machines" },
  { value: "yoga_mat", label: "Yoga Mat" },
  { value: "none", label: "No Equipment" },
] as const;

const FitnessProfileForm = () => {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    displayName: "",
    ageRange: "18-24",
    sex: "male",
    fitnessLevel: "beginner",
    goals: [],
    injuriesOrLimitations: [],
    availableEquipment: [],
    preferredTrainingDays: [],
    preferredWorkoutDuration: "medium",
    locationPreference: "gym",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: checked
        ? [...prevData[name as keyof FormData], value]
        : prevData[name as keyof FormData].filter((v) => v !== value),
    }));
  };

  const handleInjuriesChange = (value: string) => {
    setFormData((prevData) => ({
      ...prevData,
      injuriesOrLimitations: value.split(",").map((v) => v.trim()),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await completeProfile(formData);
      // Redirect to dashboard or home page after successful profile completion
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Complete Your Profile
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Please provide your information to get started with personalized workouts
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* User Information Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                    Display Name
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Fitness Profile Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Fitness Profile</h3>
              
              {/* Basic Information */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="ageRange" className="block text-sm font-medium text-gray-700">
                    Age Range
                  </label>
                  <select
                    id="ageRange"
                    name="ageRange"
                    value={formData.ageRange}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  >
                    <option value="">Select age range</option>
                    {AGE_RANGES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="sex" className="block text-sm font-medium text-gray-700">
                    Sex
                  </label>
                  <select
                    id="sex"
                    name="sex"
                    value={formData.sex}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  >
                    <option value="">Select sex</option>
                    {SEX_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fitness Level and Goals */}
              <div>
                <label htmlFor="fitnessLevel" className="block text-sm font-medium text-gray-700">
                  Fitness Level
                </label>
                <select
                  id="fitnessLevel"
                  name="fitnessLevel"
                  value={formData.fitnessLevel}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                >
                  <option value="">Select fitness level</option>
                  {FITNESS_LEVELS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Fitness Goals</label>
                <div className="mt-2 space-y-2">
                  {FITNESS_GOALS.map((option) => (
                    <div key={option.value} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`goal-${option.value}`}
                        name="goals"
                        value={option.value}
                        checked={formData.goals.includes(option.value)}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor={`goal-${option.value}`} className="ml-2 block text-sm text-gray-900">
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Training Preferences */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="preferredWorkoutDuration" className="block text-sm font-medium text-gray-700">
                    Preferred Workout Duration
                  </label>
                  <select
                    id="preferredWorkoutDuration"
                    name="preferredWorkoutDuration"
                    value={formData.preferredWorkoutDuration}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  >
                    <option value="">Select duration</option>
                    {WORKOUT_DURATIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="locationPreference" className="block text-sm font-medium text-gray-700">
                    Location Preference
                  </label>
                  <select
                    id="locationPreference"
                    name="locationPreference"
                    value={formData.locationPreference}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  >
                    <option value="">Select location</option>
                    {LOCATION_PREFERENCES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Training Days */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Preferred Training Days</label>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {WEEKDAYS.map((option) => (
                    <div key={option.value} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`day-${option.value}`}
                        name="preferredTrainingDays"
                        value={option.value}
                        checked={formData.preferredTrainingDays.includes(option.value)}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor={`day-${option.value}`} className="ml-2 block text-sm text-gray-900">
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Equipment */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Available Equipment</label>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {EQUIPMENT_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`equipment-${option.value}`}
                        name="availableEquipment"
                        value={option.value}
                        checked={formData.availableEquipment.includes(option.value)}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor={`equipment-${option.value}`} className="ml-2 block text-sm text-gray-900">
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Injuries/Limitations */}
              <div>
                <label htmlFor="injuriesOrLimitations" className="block text-sm font-medium text-gray-700">
                  Injuries or Limitations
                </label>
                <textarea
                  id="injuriesOrLimitations"
                  name="injuriesOrLimitations"
                  value={formData.injuriesOrLimitations.join(", ")}
                  onChange={(e) => handleInjuriesChange(e.target.value)}
                  placeholder="Enter injuries or limitations separated by commas"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  rows={3}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Complete Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FitnessProfileForm; 