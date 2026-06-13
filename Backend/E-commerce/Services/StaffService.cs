using E_commerce.DTOs.Staff;
using E_commerce.Models;
using E_commerce.Repositories.Interfaces;
using E_commerce.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace E_commerce.Services
{
    public class StaffService : IStaffService
    {
        private readonly IStaffRepository _staffRepository;

        public StaffService(IStaffRepository staffRepository)
        {
            _staffRepository = staffRepository;
        }

        public async Task<List<StaffResponse>> GetAllStaff()
        {
            var staff = await _staffRepository.GetAllStaff();

            return staff.Select(u => new StaffResponse
            {
                Id = u.Id,
                Name = u.Name,
                Email = u.Email,
                FullName = u.FullName,
                PhoneNumber = u.PhoneNumber,
                TotalSpend = u.totalSpend,
                RoleName = u.UserRoles.FirstOrDefault()?.Role?.Name ?? "Staff"
            }).ToList();
        }

        public async Task<StaffResponse> GetStaffById(Guid id)
        {
            var staff = await _staffRepository.GetStaffById(id);
            if (staff == null)
                return null;

            return new StaffResponse
            {
                Id = staff.Id,
                Name = staff.Name,
                FullName = staff.FullName,
                PhoneNumber = staff.PhoneNumber,
                TotalSpend = staff.totalSpend,
                RoleName = staff.UserRoles.FirstOrDefault()?.Role?.Name ?? "Staff"
            };
        }

        public async Task<string> CreateStaff(CreateStaff staff)
        {
            var email = staff.Email.Trim().ToLower();

            if (await _staffRepository.EmailExists(email))
                return "Email already exists";

            var staffRole = await _staffRepository.GetStaffRole();
            if (staffRole == null)
                return "Staff role not found";

            var newStaff = new User
            {
                Id = Guid.NewGuid(),
                Name = staff.Name,
                FullName = staff.FullName,
                Email = email,
                Password = BCrypt.Net.BCrypt.HashPassword(staff.Password),
                PhoneNumber = staff.PhoneNumber,
                UserRoles = new List<UserRole>
                {
                    new UserRole { RoleId = staffRole.Id }
                }
            };

            try
            {
                await _staffRepository.AddStaff(newStaff);
                await _staffRepository.SaveChanges();
                return "Create successfully";
            }
            catch (DbUpdateException)
            {
                return "Email already exists";
            }
        }

        public async Task<string> UpdateStaff(Guid id, UpdateStaff staff)
        {
            var currentStaff = await _staffRepository.GetStaffById(id);
            if (currentStaff == null)
                return "Staff not found";

            currentStaff.Name = staff.Name;
            currentStaff.FullName = staff.FullName;
            currentStaff.PhoneNumber = staff.PhoneNumber;

            await _staffRepository.SaveChanges();
            return "Updated successfully";
        }

        public async Task<string> DeleteStaff(Guid id)
        {
            var staff = await _staffRepository.GetStaffById(id);
            if (staff == null)
                return "Staff not found";

            _staffRepository.DeleteStaff(staff);
            await _staffRepository.SaveChanges();
            return "Deleted successfully";
        }
    }
}