using E_commerce.DTOs.User;
using E_commerce.Models;
using E_commerce.Repositories.Interfaces;
using E_commerce.Services.Interfaces;

namespace E_commerce.Services
{
    public class AdminUserService : IAdminUserService
    {
        private static readonly HashSet<string> AllowedRoles = new(StringComparer.OrdinalIgnoreCase)
        {
            "Admin",
            "Staff"
        };

        private readonly IUserRepository _userRepository;
        private readonly IRoleRepository _roleRepository;

        public AdminUserService(IUserRepository userRepository, IRoleRepository roleRepository)
        {
            _userRepository = userRepository;
            _roleRepository = roleRepository;
        }

        public async Task<ServiceResponse<AdminCreateUserResponse>> CreateStaffOrAdminAsync(AdminCreateUserRequest dto)
        {
            var response = new ServiceResponse<AdminCreateUserResponse>();

            var email = dto.Email.Trim().ToLower();
            if (!await _userRepository.IsEmailUniqueAsync(email))
            {
                response.IsSuccess = false;
                response.Message = "Email already exists.";
                return response;
            }

            var roleName = dto.RoleName.Trim();
            if (!AllowedRoles.Contains(roleName))
            {
                response.IsSuccess = false;
                response.Message = "Role must be Admin or Staff.";
                return response;
            }

            var role = await _roleRepository.GetByNameAsync(roleName);
            if (role == null)
            {
                response.IsSuccess = false;
                response.Message = $"Role '{roleName}' not found in system.";
                return response;
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                Name = dto.Name.Trim(),
                Email = email,
                PhoneNumber = dto.PhoneNumber.Trim(),
                Password = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                FullName = dto.Name.Trim(),
                UserRoles = new List<UserRole> { new UserRole { RoleId = role.Id } }
            };

            await _userRepository.AddAsync(user);
            var saveResult = await _userRepository.SaveChangesAsync();

            if (!saveResult)
            {
                response.IsSuccess = false;
                response.Message = "An error occurred while saving the user.";
                return response;
            }

            response.IsSuccess = true;
            response.Message = "User created successfully.";
            response.Data = new AdminCreateUserResponse
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                RoleName = role.Name
            };
            return response;
        }
    }
}
